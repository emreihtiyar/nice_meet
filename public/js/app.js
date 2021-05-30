const menu = new mdc.menu.MDCMenu(document.querySelector('.mdc-menu'));
let db = null;
let auth = null;

const firebaseConfig = {
    apiKey: "AIzaSyCeuHu2KoX_rSVNAeKATRSDQEmMps1bHvs",
    authDomain: "nicetomeet-33b4a.firebaseapp.com",
    databaseURL: "https://nicetomeet-33b4a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "nicetomeet-33b4a",
    storageBucket: "nicetomeet-33b4a.appspot.com",
    messagingSenderId: "242610313695",
    appId: "1:242610313695:web:6c804cd2dff52ad5990c6a",
    measurementId: "G-F840F7K0YQ"
};

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};
//! roomRef -> rooms/FAh3XJDyZxVxGhA8k23i rooms/oda_id'sini tutuyor ve bunu bir documannReference olarak tutar.
//! ICE Candidate -> (ICE isteği) -> ARAŞTIR.

let roomDialog = null;

let nameId = null;  //nameId -> şuandaki kullanıcının id'si (currentUser.uid) //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil 
let contentId = null; //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil

let muteState = false;      //Benim mikrofonumun kapalı olup olmadığını tutar (kapalı -> true)
let videoState = true;      //Benim Videomunaçık olup olmadığını tutar (kapalı -> false)
let contentState = false;   //Benim sunup sunmadığımı tutar (kapalı -> false)

let cameraStream = null; //TODO: cameraStream'in global kalmasına gereksiz olabilir, bunu denemelisin
let captureStream = null; //TODO: captureStream'in global kalmasına gereksiz olabilir, bunu denemelisin

let isContentExists = false;
let isContentShown = false;

let swipeEventFunction;
var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

let roomID = null;
let currentUser = null;
let currentUserInfo = null;

/**
    ** Ekran paylaşımı başladığında, paylaşım olduğunu ve paylaşımın özelliklerini kaydeder firebase'e kaydeder
 */
function signalContentShare(roomRef) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    //TODO: rasgeleID ve  display:'content' burada atanıyor ancak bu rasgeleyi userid yaparsam bu sefer aynı adda olan ve display:'user' olan silinecek buda kamera content bilgisini siler
    contentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    doc = roomRef.collection('partyList').doc(contentId);
    doc.set({
        "name": contentId,
        "username":currentUserInfo.username,
        "display": "content",
        "muteState":muteState,
        "videoState":videoState
    });
    requestConnectionToCurrentPeers(roomRef, contentId, true);
    acceptConnectionsFromJoiningPeers(roomRef, contentId, true);

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    **Hangup butonuna basıldığında baplantıyı kesmek için önce partyList'den idmizi siliyor,
    **ardından eğer sunumu biz yapıyorsak onuda siliyor.
 * @param {*} roomRef 
 */
    function signalHangup(roomRef) {
        console.log(arguments.callee.name, " Fonksiyonun başındayız.");
        
        document.querySelector('#hangup-btn').addEventListener('click', async () => {
            console.log("Disconnecting");
            roomRef.collection('partyList').doc(nameId).delete();
            if (contentState) {
                roomRef.collection('partyList').doc(contentId).delete();
            }
        });
        
        console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

function switchStream(peerConnection, stream) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    let videoTrack = stream.getVideoTracks()[0];
    var sender = peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
    });
    console.log('found sender:', sender);
    sender.replaceTrack(videoTrack);
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

async function addUserToRoom(roomRef) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    //let Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    roomRef.collection('partyList').doc(currentUser.uid).set({
        'name': currentUser.uid,
        "username":currentUserInfo.username,
        'display': 'user',
        "muteState":muteState,
        "videoState":videoState
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    return currentUser.uid;
}

/**
    ** Odada zaten bulunan mevcut eşlere bağlantı talebi göndermek için kullanılır
    ** partyList içinden odada bulunanları al, ve her biri için
    ** önce sunan kişi mi? kontrol et, eğer öyleyse ekrandaki ekran paylaş butonunu gizle
    ** bu peer'lara bağlantı isteği gönder.
 */
function requestConnectionToCurrentPeers(roomRef, Id, isContent) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    roomRef.collection('partyList').get().then(snapshot => {
        snapshot.docs.forEach(async doc => {
            const peerId = doc.data().name
            const isPeerContent = doc.data().display == 'content';
            if (peerId != nameId && peerId != Id) {
                if (isPeerContent) {
                    console.log('Content Identified');
                    document.getElementById('screen-share-btn').classList.add('hidden');
                }
                console.log('Sending request to: ' + peerId);
                await peerRequestConnection(peerId, roomRef, Id, isContent, isPeerContent);
            }
        })
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    ** Katılan Kullanıcıları kabul et
    ** firebase'de şuandaki kullanıcının id'sinin (veya contentId) altındaki SDP->offer isteklerini topluyor ve her yeni eklenende,
    ** önce display bilgisinden content olup olmadığını kontrol ediyor ve ardından
    ** *peerAcceptConnection* fonksiyonunu çağırıyor
    * eğer content'se fonksiyonu çağırırken buna göre değişiyor ve ekrandaki ekranı paylaş butonunu gizliyor
 */
function acceptConnectionsFromJoiningPeers(roomRef, nameId, isReceiverContent) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    roomRef.collection(nameId).doc('SDP').collection('offer').onSnapshot(async snapshot => {
        await snapshot.docChanges().forEach(async change => {
            if (change.type === 'added') {
                console.log("Accepting Request from: " + change.doc.id);
                let isSenderContent = false;
                console.log("Display : ");
                console.log(change.doc.data());
                if (change.doc.data().display == 'content') {
                    console.log('Content Identified');
                    isSenderContent = true;
                    document.getElementById('screen-share-btn').classList.add('hidden');
                }
                console.log('Is sender content ' + isSenderContent);
                await peerAcceptConnection(change.doc.id, roomRef, nameId, isSenderContent, isReceiverContent);
            } else {
                console.log("Mesh has been setup.");
            }
        })
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    * Kamera ve mikrofonun açılmasını sağlar ve kamera görüntüsünü cameraStream'de tutar.
 */
async function openUserMedia() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    navigator.mediaDevices.enumerateDevices().then(devices => {
        devices.forEach(device => {
            const deviceNode = document.createElement("li");
            deviceNode.innerText = device.label;
            deviceNode.classList.add("mdc-list-item");
            deviceNode.role = "menuitem";
            deviceNode.tabIndex = 0;

            //if (device.kind == "audioinput") {
            //document.getElementById("microphones").appendChild(deviceNode);
            if (device.kind == "videoinput") {
                deviceNode.addEventListener('click', () => changeCamera(device.deviceId))
                document.getElementById("cameras").appendChild(deviceNode);
            }
        });
    });

    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user"
        },
        audio: {
            echoCancellation: true,    //TODO: fixme-düzelt -> true olmalı
            noiseSuppression: true,    //TODO: fixme-düzelt -> true olmalı
            autoGainControl: true,     //TODO: fixme-düzelt -> true olmalı
        }
    });

    document.querySelector('#local-video').srcObject = cameraStream;

    console.log('Stream:', document.querySelector('#local-video').srcObject);
    document.querySelector('#join-btn').classList.remove("hidden");
    document.querySelector('#create-btn').classList.remove("hidden");

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    *bağlantıdan çık ve sayfayı yenile bu sayede görüşmeden çıkmış olursun
 */
function hangUp() {
    const tracks = document.querySelector('#local-video').srcObject.getTracks();
    tracks.forEach(track => {
        track.stop();
    });

    window.location = window.location.pathname;
}

/**
    * Giriş yapmış kullanıcının bilgilerini getirir, giriş sayfasından buraya aktarılmaz bu nedenle bu fonksiyon ile kullanıcı bilgilerine ulaşabiliriz
 */
async function getCurrentUserInfo() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            console.log(auth.currentUser);
            currentUser = auth.currentUser;
            db.collection('users').doc(currentUser.uid).get().then(snap => {
                currentUserInfo = snap.data();
            });
        } else {
            if (params.get('roomId')) {
                window.location.href = "/" + "?roomId=" + params.get('roomId');
            }
        }
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


async function createRoom() {
    document.querySelector('#local-video').addEventListener('click', hideLocalVideo);
    document.querySelector('#hangup-btn').classList.remove("hidden");
    document.querySelector('#create-btn').classList.add("hidden");
    document.querySelector('#share-btn').classList.remove("hidden");
    document.querySelector('#mute-btn').classList.remove("hidden");
    document.querySelector('#join-btn').classList.add("hidden");
    document.querySelector('#screen-share-btn').classList.remove("hidden");
    document.querySelector('#chat-btn').classList.remove("hidden");
    document.querySelector('#users-btn').classList.remove("hidden");
    document.querySelector('#record-btn').classList.remove("hidden");

    
    const roomRef = await db.collection('rooms').doc();
    console.log("roomRef: ", roomRef);

    document.querySelector('#share-btn').onclick = () => {
        //window.open(`https://api.whatsapp.com/send?text=${window.location.href.split('?')[0]}?roomId=${roomRef.id}`,"_blank");
        window.open(`https://nicetomeet-33b4a.web.app/?roomId=${roomRef.id}`, "_blank");
    };

    nameId = await addUserToRoom(roomRef);
    roomRef.set({ host: nameId });

    acceptConnectionsFromJoiningPeers(roomRef, nameId, false);

    /*Create Chat Room and Listen chat rooms changes */
    roomID = roomRef.id;
    createChatRoom(roomID);
    incomingMessageListener();

    /*Odaya girenleri kontrol etmek için veya kamera, mikrofon ve içerik bilgilerini firebase'de değiştirmek için  */
    partyListListener(roomRef);
    mutingStateChangeInFirebase(roomRef);
    videoStateChangeInFirebase(roomRef);

    signalHangup(roomRef);
    console.log(`Room ID: ${roomRef.id}`);
    document.querySelector('#screen-share-btn').addEventListener('click', () => contentToggleButton(roomRef));
}

function joinRoom() {
    document.querySelector('#confirmJoinBtn').
        addEventListener('click', async () => {
            const roomId = document.querySelector('#room-id').value;
            await joinRoomById(roomId);
        }, { once: true });
    roomDialog.open();
}

async function joinRoomById(roomId) {
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
        document.querySelector('#hangup-btn').classList.remove("hidden");
        document.querySelector('#local-video').addEventListener('click', hideLocalVideo);
        document.querySelector('#share-btn').onclick = () => {
            //window.open(`https://api.whatsapp.com/send?text=${window.location.href.split('?')[0]}?roomId=${roomRef.id}`,"_blank")
            window.open(`https://nicetomeet-33b4a.web.app/?roomId=${roomRef.id}`, "_blank");
        };

        //document.querySelector('#share-btn').classList.remove("hidden"); //TODO: Host olmayanlar bu odayayı paylaşabilmeli mi?
        document.querySelector('#create-btn').classList.add("hidden");
        document.querySelector('#join-btn').classList.add("hidden");
        document.querySelector('#mute-btn').classList.remove("hidden");
        document.querySelector('#screen-share-btn').classList.remove("hidden");
        document.querySelector('#chat-btn').classList.remove("hidden");
        document.querySelector('#users-btn').classList.remove("hidden");
        //document.querySelector('#record-btn').classList.remove("hidden"); //TODO: Katılanlar kaydetmese daha iyi olabilir.

        nameId = await addUserToRoom(roomRef);

        console.log('Join room: ', roomId);

        requestConnectionToCurrentPeers(roomRef, nameId, false);

        acceptConnectionsFromJoiningPeers(roomRef, nameId, false);

        /*Create Chat Room and Listen chat rooms changes */
        roomID = roomRef.id;
        incomingMessageListener(roomID);

        /*Odaya girenleri kontrol etmek için veya kamera, mikrofon ve içerik bilgilerini firebase'de değiştirmek için  */
        partyListListener(roomRef);
        mutingStateChangeInFirebase(roomRef);
        videoStateChangeInFirebase(roomRef);

        signalHangup(roomRef);

        document.querySelector('#screen-share-btn').addEventListener('click', () => contentToggleButton(roomRef));

    } else {
        document.querySelector('#current-room').innerText = `Room: ${roomId} - Doesn't exist!`;
    }
}

function init() {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    
    if (location.hostname === "localhost") {
        db.useEmulator("localhost", "8080");
        auth.useEmulator("localhost", "9099");
    }

    params = new URLSearchParams(location.search);
    roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));

    getCurrentUserInfo(); //kullanıcı ve kullanıcı id'sini alıyoruz, yok ise giriş sayfasına yönlendiriyoruz
    openUserMedia(); //kamera ve mikrofon'dan stream'i alıyoruz

    if (params.get('roomId')) {
        console.log('Done');
        document.querySelector('#room-id').value = params.get('roomId');
        joinRoom();
    }

    addAllListener(); // *Ekrandaki Butonların veya diğer objelerin dinleyicilerini yerleştiriyor

    hideNavBarOnTap(); //ekranda biryere tıklandığında butonları kapatıyor, fonksiyon kendi içinde dinliyor.

    muteToggleEnable(); //Mute butonunu dinliyor
    videoToggleEnable(); //Video butonunu dinliyor

    var eventName = isiOS ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, function () {
        document.getElementById('hangup-btn').click();
    });

}

init();
