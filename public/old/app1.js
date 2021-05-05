//mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 100,
};

let localStream = null;
//let remoteStream = null;
let roomDialog = null;
let roomId = null;

let connectedCandidates = [];
let peerConnections = [];
let sesionDescriptions = {};
let remoteStreams = [];
let numberOfPeer = 3;

function init() {
    document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
    //document.querySelector('#hangupBtn').addEventListener('click', hangUp);
    document.querySelector('#createBtn').addEventListener('click', createRoom);
    //document.querySelector('#joinBtn').addEventListener('click', joinRoom);

    //roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));
}


async function createRoom() {
    //! Firestore baglantisi ve Rooms icinde yeni ve rasgele ID'libir oda olustur.
    const db = firebase.firestore(); //Firestore'a baglaniyoruz
    //rooms Collection'unun altinda yeni ve rasgele id'li bir document olusturur. 
    const roomRef = await db.collection('rooms').doc(); //* roomRef olusturulan odanin referansi

    //! numberOfPeer kadar peer olustur 
    //TODO: Bu statik bir olusturmma bunu dinamik hale girmeli
    //Bir PeerConnection olusturuyoruz, configrasyon belli ama herhangi biryere bagli degil vey asinyallesme asamasinda degil
    console.log('Create PeerConnection with configuration: ', configuration);
    for (let i = 0; i < numberOfPeer; i++) {
        peerConnections.push(new RTCPeerConnection(configuration));
    }

    // Peerlarla olan iletisim durumunu gosterir
    console.log("satir-39 registerPeerConnectionListeners cagiriliyor.... <CreateRoom>");
    registerPeerConnectionListeners();

    //! LocalStream'de olan yani benim goruntumu diger peerlara aktarilmasi
    peerConnections.forEach(peerConnection => {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    });

    //! ICE adaylıklarını toplamak icin
    //TODO: Bu alan daha iyi anlamaya calisilmali
    // Code for collecting ICE candidates below
    const callerCandidatesCollection = roomRef.collection('callerCandidates');

    peerConnections.forEach(peerConnection => {
        peerConnection.addEventListener('icecandidate', event => {
            if (!event.candidate) {
                console.log('Got final candidate!');
                return;
            }
            //console.log('satir-54 Got candidate: ', event.candidate);
            callerCandidatesCollection.add(event.candidate.toJSON());
        });
    });
    // Code for collecting ICE candidates above

    //! Oda olusturmak icin once bir offer(teklif) olusturuyoruz ve olusturan teklifi onceden olusturulmus tum peer'lara gonderiyoruz.
    // Code for creating a room below
    let offer = null;
    for (const peerConnection of peerConnections) {
        offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Created offer:', offer);
    }
    //! olusturulan offer'i Firestore'a kayit ediyoruz ki gelecekler oradan bu offer bilgisini alabilsinler
    const roomWithOffer = {
        'offer': {
            type: offer.type,
            sdp: offer.sdp,
        },
    };
    await roomRef.set(roomWithOffer);
    roomId = roomRef.id;
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    // document.querySelector('#currentRoom').innerText = `Current room is ${roomRef.id} - You are the caller!`;
    // Code for creating a room above

    //! Her bir peer icin bir remoteStream olusturup ona Track ekleyip ardindan bunlari remoteStreams Dizisinde tutuyoruz.
    //TODO: Buradaki event, event.streams neyi ifade ediyor bunu ogrenmeliyim
    //? event.streams'deki her bir stream baska kaynaktan gelenmiy yoksa baska birsey mi?
    for (const peerConnection of peerConnections) {//Her bir peer'i al
        peerConnection.addEventListener('track', event => { // Peer'a bir Track Listener ekle
            console.log('Got remote stream array:', event.streams);
            console.log('Got remote track:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStreams:', track);
                let remoteStream = new MediaStream();
                remoteStream.addTrack(track);
                remoteStreams.push(remoteStream);
            });
        });
    }

    //!
    // Listening for remote session description below
    roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        console.log('Room Snapshot');
        console.log('peerConnections len: ', peerConnections.length);
        console.log('peerConnections', peerConnections);

        if (!peerConnections[0].currentRemoteDescription && data && data.answer) { //ilk ve kismi Garip
            console.log(' Got remote description: ', data.answer);
            const rtcSessionDescription = new RTCSessionDescription(data.answer);
            await peerConnections[0].setRemoteDescription(rtcSessionDescription);
            //peerConnections.push(new RTCPeerConnection(configuration).setRemoteDescription(rtcSessionDescription))
            sesionDescriptions[peerConnections[0]] = rtcSessionDescription
        }
    });
    // Listening for remote session description above

    //!
    // Listen for remote ICE candidates below
    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
            if (change.type === 'added') {
                let data = change.doc.data();
                console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                //for (const peerConnection of peerConnections) { //Biri baglanmaya calisinca buraya geliyor
                let peerConnection = peerConnections[0]
                await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                if (!peerConnection.currentRemoteDescription && data && data.answer) {
                    console.log('Got remote description: ', data.answer);
                    const rtcSessionDescription = new RTCSessionDescription(data.answer);
                    await peerConnection.setRemoteDescription(rtcSessionDescription);
                    sesionDescriptions[peerConnection] = rtcSessionDescription;
                }
                //}
            }
        });
    });
}

//TODO:Buradaki videolari falan ayarla
async function openUserMedia(e) {
    const stream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: false }); //ses ve goruntunun hangilerininn iletileceginibelirliyoruz.
    document.querySelector('#localVideo').srcObject = stream;
    localStream = stream;
    //remoteStream = new MediaStream();
    document.querySelector('#remoteVideo').srcObject = remoteStreams[0];
    document.querySelector('#remoteVideo2').srcObject = remoteStreams[1]; //video objesine akis ekliyor, akis bos olsada
    document.querySelector('#remoteVideo3').srcObject = remoteStreams[2]

    console.log('Stream:', document.querySelector('#localVideo').srcObject);
    //document.querySelector('#cameraBtn').disabled = true;
    //document.querySelector('#joinBtn').disabled = false;
    //document.querySelector('#createBtn').disabled = false;
    //document.querySelector('#hangupBtn').disabled = false;
}

function registerPeerConnectionListeners() {
    for (const peerConnection of peerConnections) {
        peerConnection.addEventListener('icegatheringstatechange', () => {
            console.log(
                `satir-257 ICE gathering state changed: ${peerConnection.iceGatheringState}`);
        });

        peerConnection.addEventListener('connectionstatechange', () => {
            console.log(`satir-261 Connection state change: ${peerConnection.connectionState}`);
        });

        peerConnection.addEventListener('signalingstatechange', () => {
            console.log(`satir-265 Signaling state change: ${peerConnection.signalingState}`);
        });

        peerConnection.addEventListener('iceconnectionstatechange ', () => {
            console.log(
                `270 ICE connection state change: ${peerConnection.iceConnectionState}`);
        });

    }
}

init()