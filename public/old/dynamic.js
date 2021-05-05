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

    peerConnections.push(new RTCPeerConnection(configuration));


}

//TODO:Buradaki videolari falan ayarla
async function openUserMedia(e) {
    const stream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: false }); //ses ve goruntunun hangilerininn iletileceginibelirliyoruz.
    localStream = new MediaStream();
    document.querySelector('#localVideo').srcObject = stream;
    localStream = stream;
    //remoteStream = new MediaStream();
    document.querySelector('#remoteVideo').srcObject = remoteStreams[0];
    
    //document.querySelector('#remoteVideo2').srcObject = remoteStreams[1]; //video objesine akis ekliyor, akis bos olsada
    //document.querySelector('#remoteVideo3').srcObject = remoteStreams[2]

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