const menu = new mdc.menu.MDCMenu(document.querySelector('.mdc-menu'));
let roomDialog = null;

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

let db = null;
let auth = null;

let nameId = null;  //nameId -> şuandaki kullanıcının id'si (currentUser.uid) //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil 
let contentId = null; //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil
let roomRef = null;

let muteState = false;      //Benim mikrofonumun kapalı olup olmadığını tutar (kapalı -> true)
let videoState = true;      //Benim Videomun açık olup olmadığını tutar (kapalı -> false)
let contentState = false;   //Benim sunup sunmadığımı tutar (kapalı -> false)

let cameraStream = null; //TODO: cameraStream'in global kalmasına gereksiz olabilir, bunu denemelisin
let captureStream = null; //TODO: captureStream'in global kalmasına gereksiz olabilir, bunu denemelisin

let isContentExists = false;
let isContentShown = false;

let swipeEventFunction;

let roomID = null;
let currentUser = null;
let currentUserInfo = null;

/**
    ** Ekran paylaşımı başladığında, paylaşım olduğunu ve paylaşımın özelliklerini kaydeder firebase'e kaydeder
 */
function signalContentShare() {
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
    requestConnectionToCurrentPeers(contentId, true);
    acceptConnectionsFromJoiningPeers(contentId, true);

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    **Hangup butonuna basıldığında baplantıyı kesmek için önce partyList'den idmizi siliyor,
    **ardından eğer sunumu biz yapıyorsak onuda siliyor.
 * @param {*} roomRef 
 */
    function signalHangup() {
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

async function addUserToRoom() {
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
function requestConnectionToCurrentPeers(Id, isContent) {
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
                await peerRequestConnection(peerId, Id, isContent, isPeerContent);
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
function acceptConnectionsFromJoiningPeers(nameId, isReceiverContent) {
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
                await peerAcceptConnection(change.doc.id, nameId, isSenderContent, isReceiverContent);
            } else {
                console.log("Mesh has been setup.");
            }
        })
    });

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
            createSideAlert("Giriş Yapmanız gerekli. Yönlendiriliyorsunuz.", "warning");
            if (params.get('roomId')) {
                window.location.href = "/" + "?roomId=" + params.get('roomId');
            } else {
                window.location.href = "/";
            }
        }
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


async function createRoom() {
    createSideAlert("Oda oluşturuluyor, Lütfen bekleyiniz", "primary", 3);

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

    
    roomRef = await db.collection('rooms').doc();
    console.log("roomRef: ", roomRef);

    setUIRoomInfo(roomRef.id, `${location.hostname}/?roomId=${roomRef.id}`)

    nameId = await addUserToRoom(roomRef);
    roomRef.set({ host: nameId });

    acceptConnectionsFromJoiningPeers(nameId, false);

    /*Create Chat Room and Listen chat rooms changes */
    roomID = roomRef.id;
    createChatRoom(roomID);
    incomingMessageListener();

    /*Odaya girenleri kontrol etmek için veya kamera, mikrofon ve içerik bilgilerini firebase'de değiştirmek için  */
    partyListListener();
    mutingStateChangeInFirebase();
    videoStateChangeInFirebase();

    signalHangup();
    console.log(`Room ID: ${roomRef.id}`);
    document.querySelector('#screen-share-btn').addEventListener('click', () => contentToggleButton());

    createSideAlert("Oda oluşturuldu. oda numarası: " + roomRef.id, "succes", 5);
    createSideAlert("Kullanıcıları davet etmek için paylaş butonunu kullanabilirsiniz.", "primary", 5);
    highlightElement("share-btn", 5);
}

function joinRoom() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    document.querySelector('#confirmJoinBtn').
        addEventListener('click', async () => {
            const roomId = document.querySelector('#room-id').value;
            await joinRoomById(roomId);
        }, { once: true });
    roomDialog.open();

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

async function joinRoomById(roomId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
        document.querySelector('#hangup-btn').classList.remove("hidden");
        document.querySelector('#local-video').addEventListener('click', hideLocalVideo);
        
        setUIRoomInfo(roomRef.id, `${location.hostname}/?roomId=${roomRef.id}`)
        
        //document.querySelector('#share-btn').classList.remove("hidden"); //TODO: Host olmayanlar bu odayayı paylaşabilmeli mi?
        document.querySelector('#create-btn').classList.add("hidden");
        document.querySelector('#join-btn').classList.add("hidden");
        document.querySelector('#mute-btn').classList.remove("hidden");
        document.querySelector('#screen-share-btn').classList.remove("hidden");
        document.querySelector('#chat-btn').classList.remove("hidden");
        document.querySelector('#users-btn').classList.remove("hidden");
        //document.querySelector('#record-btn').classList.remove("hidden"); //TODO: Katılanlar kaydetmese daha iyi olabilir.

        nameId = await addUserToRoom();

        console.log('Join room: ', roomId);

        requestConnectionToCurrentPeers( nameId, false);

        acceptConnectionsFromJoiningPeers( nameId, false);

        /*Create Chat Room and Listen chat rooms changes */
        roomID = roomRef.id;
        incomingMessageListener(roomID);

        /*Odaya girenleri kontrol etmek için veya kamera, mikrofon ve içerik bilgilerini firebase'de değiştirmek için  */
        partyListListener();
        mutingStateChangeInFirebase();
        videoStateChangeInFirebase();

        signalHangup();

        document.querySelector('#screen-share-btn').addEventListener('click', () => contentToggleButton());

    } else {
        document.querySelector('#current-room').innerText = `Room: ${roomId} - Doesn't exist!`;
    }

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

function init() {
    firebase.initializeApp(firebaseConfig); //firebase bağlantı bilgilerini girer
    db = firebase.firestore(); //firestore'a bağlanır
    auth = firebase.auth(); //auth'a bağlanır
    
    if (location.hostname === "localhost") {
        db.useEmulator("localhost", "8080");
        auth.useEmulator("localhost", "9099");
    }

    params = new URLSearchParams(location.search);
    roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));

    //TODO: Burası Localde çalışamalar bittikten sonra açılacak 
    getCurrentUserInfo(); //kullanıcı ve kullanıcı id'sini alıyoruz, yok ise giriş sayfasına yönlendiriyoruz
    openUserMedia(); //kamera ve mikrofon'dan stream'i alıyoruz

    if (params.get('roomId')) {
        console.log('Done');
        document.querySelector('#room-id').value = params.get('roomId');
        joinRoom();
    }

    addAllListener(); // *Ekrandaki Butonların veya diğer objelerin dinleyicilerini yerleştiriyor

    hideNavBarOnTap(); //ekranda biryere tıklandığında butonları kapatıyor, fonksiyon kendi içinde dinliyor.

    window.addEventListener(
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ? 'pagehide' : 'beforeunload',
        function () {
            document.getElementById('hangup-btn').click();
    });
}

$(document).ready(function () {
    init();
});
