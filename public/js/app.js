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

let nameId = null;  //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil
let contentId = null; //TODO: Bundan kurtulmaya çalışıyorum ama kesin olacak mı belli değil

let muteState = false;
let videoState = true;
var contentState = false;
let screenState = false;

let cameraStream = null; //TODO: cameraStream'in global kalmasına gereksiz olabilir, bunu denemelisin
let captureStream = null; //TODO: captureStream'in global kalmasına gereksiz olabilir, bunu denemelisin

let isContentExists = false;
let isContentShown = false;
let swipeEventFunction;
var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

let roomID = null;
let currentUser = null;
let currentUserInfo = null;


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
    console.log(arguments.callee.name, " Fonksiyonun sonundayız. doc=");
}

async function contentToggleButton(roomRef) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    if (!screenState) {
        const displayMediaOptions = {
            video: {
                cursor: "always"
            },
            audio: false
        };
        try {
            console.log('Toggling screen share');
            captureStream = await startCapture(displayMediaOptions);
            toggleOnContent(roomRef);
        } catch (error) {
            console.log(error.message);
        }
    } else {
        contentToggleOff(roomRef);
    }
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

function changeCamera(deviceId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: deviceId
        },
        audio: true
    }).then(stream => {
        document.getElementById('localVideo').srcObject = stream;
        cameraStream = stream
    });
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


function receiveStream(peerConnection, remoteEndpointID, isPeerContent) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        if (document.querySelector("#video" + remoteEndpointID) == null) {
            createPeerVideo(remoteEndpointID, isPeerContent);
        }
        document.querySelector("#video" + remoteEndpointID).srcObject = event.streams[0];
        document.querySelector("#video" + remoteEndpointID).muted = false;
    });
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


function sendStream(peerConnection, stream) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


function closeConnection(peerConnection, roomRef, peerId) {
    roomRef.collection('partyList').where('name', '==', peerId).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type == 'removed') {
                if (change.doc.data().display == 'content') {
                    if (!isHandheld()) {
                        document.getElementById('screenShareButton').classList.remove('hidden');
                    }
                    isContentExists = false;
                    isContentShown = false;
                    document.removeEventListener('touchmove', swipeEventFunction);
                }
                peerConnection.close();
                if (document.getElementById("video" + peerId + "Container") != null) {
                    document.getElementById("video" + peerId + "Container").remove();
                }
                enforceLayout(--numberOfDisplayedPeers);
            }
        });
    });

    peerConnection.onconnectionstatechange = function () {
        if (peerConnection.connectionState == 'disconnected' || peerConnection.connectionState == "failed") {
            //roomRef.collection('partyList').doc(peerId).delete();
            peerConnection.close();
            if (document.getElementById("video" + peerId + "Container") != null) {
                document.getElementById("video" + peerId + "Container").remove();
            }
        }
    }
}


async function peerRequestConnection(peerId, roomRef, nameId, isUserContent, isPeerContent) {
    console.log('Create PeerConnection with configuration: ', configuration);
    const peerConnection = new RTCPeerConnection(configuration);

    registerPeerConnectionListeners(peerConnection);

    if (isUserContent) {
        sendStream(peerConnection, captureStream)
    } else {
        sendStream(peerConnection, cameraStream)
        document.getElementById('cameras').childNodes.forEach(camera => {
            camera.addEventListener('click', () => {
                switchStream(peerConnection, cameraStream);
            });
        });
    }

    signalICECandidates(peerConnection, roomRef, peerId, nameId);
    const offer = await createOffer(peerConnection);

    await sendOffer(offer, roomRef, peerId, nameId, isUserContent);

    if (!isUserContent) {
        receiveStream(peerConnection, peerId, isPeerContent);
    }

    await receiveAnswer(peerConnection, roomRef, peerId, nameId);

    await receiveICECandidates(peerConnection, roomRef, peerId, nameId);

    document.querySelector('#hangupBtn').addEventListener('click', () => peerConnection.close());

    if (!isUserContent) {
        closeConnection(peerConnection, roomRef, peerId);
    }

    if (!isUserContent) {
        restartConnection(peerConnection, roomRef, peerId);
    }
}

async function peerAcceptConnection(peerId, roomRef, nameId, isPeerContent, isUserContent) {
    console.log('Create PeerConnection with configuration: ', configuration)
    const peerConnection = new RTCPeerConnection(configuration);
    registerPeerConnectionListeners(peerConnection);

    if (!isPeerContent) {
        if (isUserContent) {
            sendStream(peerConnection, captureStream);
        } else {
            sendStream(peerConnection, cameraStream);
            document.getElementById('cameras').childNodes.forEach(camera => {
                camera.addEventListener('click', () => {
                    switchStream(peerConnection, cameraStream);
                });
            });
        }
    }

    signalICECandidates(peerConnection, roomRef, peerId, nameId);

    if (!isUserContent) {
        receiveStream(peerConnection, peerId, isPeerContent);
    }

    await receiveOffer(peerConnection, roomRef, peerId, nameId);

    const answer = await createAnswer(peerConnection);

    await sendAnswer(answer, roomRef, peerId, nameId, isUserContent);

    await receiveICECandidates(peerConnection, roomRef, peerId, nameId);

    document.querySelector('#hangupBtn').addEventListener('click', () => peerConnection.close());

    if (!isUserContent) {
        closeConnection(peerConnection, roomRef, peerId);
    }

    if (!isUserContent) {
        restartConnection(peerConnection, roomRef, peerId);
    }
}

function restartConnection(peerConnection, roomRef, peerId) {
    peerConnection.oniceconnectionstatechange = async function () {
        if (peerConnection.iceConnectionState === "failed") {
            console.log('Restarting connection with: ' + peerId);
            if (peerConnection.restartIce) {
                peerConnection.restartIce();
            } else {
                peerConnection.createOffer({ iceRestart: true })
                    .then(peerConnection.setLocalDescription)
                    .then(async offer => {
                        await sendOffer(offer, roomRef, peerId, false);
                    });
            }
        }
    }
}


function registerPeerConnectionListeners(peerConnection) {
    peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log( `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`Connection state change: ${peerConnection.connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
        console.log(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
        console.log(`ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
}

function requestConnectionToCurrentPeers(roomRef, Id, isContent) {
    roomRef.collection('partyList').get().then(snapshot => {
        snapshot.docs.forEach(async doc => {
            const peerId = doc.data().name
            const isPeerContent = doc.data().display == 'content';
            if (peerId != nameId && peerId != Id) {
                if (isPeerContent) {
                    console.log('Content Identified');
                    document.getElementById('screenShareButton').classList.add('hidden');
                }
                console.log('Sending request to: ' + peerId);
                await peerRequestConnection(peerId, roomRef, Id, isContent, isPeerContent);
            }
        })
    });
}

async function createRoom() {
    document.querySelector('#localVideo').addEventListener('click', hideLocalVideo);
    document.querySelector('#hangupBtn').classList.remove("hidden");
    document.querySelector('#createBtn').classList.add("hidden");
    document.querySelector('#shareButton').classList.remove("hidden");
    document.querySelector('#muteButton').classList.remove("hidden");
    document.querySelector('#joinBtn').classList.add("hidden");
    if (!isHandheld()) {
        document.querySelector('#screenShareButton').classList.remove("hidden");
    }
    const roomRef = await db.collection('rooms').doc();
    console.log("roomRef: ", roomRef);

    document.querySelector('#shareButton').onclick = () => {
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
    document.querySelector('#screenShareButton').addEventListener('click', () => contentToggleButton(roomRef));
}

function joinRoom() {
    document.querySelector('#confirmJoinBtn').
        addEventListener('click', async () => {
            const roomId = document.querySelector('#room-id').value;
            await joinRoomById(roomId);
        }, { once: true });
    roomDialog.open();
}

function acceptConnectionsFromJoiningPeers(roomRef, nameId, isReceiverContent) {
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
                    document.getElementById('screenShareButton').classList.add('hidden');
                }
                console.log('Is sender content' + isSenderContent);
                await peerAcceptConnection(change.doc.id, roomRef, nameId, isSenderContent, isReceiverContent);
            } else {
                console.log("Mesh has been setup.");
            }
        })
    });
}

async function joinRoomById(roomId) {
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
        document.querySelector('#hangupBtn').classList.remove("hidden");
        document.querySelector('#localVideo').addEventListener('click', hideLocalVideo);
        document.querySelector('#shareButton').onclick = () => {
            //window.open(`https://api.whatsapp.com/send?text=${window.location.href.split('?')[0]}?roomId=${roomRef.id}`,"_blank")
            window.open(`https://nicetomeet-33b4a.web.app/?roomId=${roomRef.id}`, "_blank");
        };

        document.querySelector('#shareButton').classList.remove("hidden");
        document.querySelector('#createBtn').classList.add("hidden");
        document.querySelector('#joinBtn').classList.add("hidden");
        document.querySelector('#muteButton').classList.remove("hidden");
        if (!isHandheld()) {
            document.querySelector('#screenShareButton').classList.remove("hidden");
        }

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

        document.querySelector('#screenShareButton').addEventListener('click', () => contentToggleButton(roomRef));

    } else {
        document.querySelector(
            '#currentRoom').innerText = `Room: ${roomId} - Doesn't exist!`;
    }
}

async function openUserMedia() {
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
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        }
    });

    document.querySelector('#localVideo').srcObject = cameraStream;

    console.log('Stream:', document.querySelector('#localVideo').srcObject);
    document.querySelector('#joinBtn').classList.remove("hidden");
    document.querySelector('#createBtn').classList.remove("hidden");
}

function hangUp() {
    const tracks = document.querySelector('#localVideo').srcObject.getTracks();
    tracks.forEach(track => {
        track.stop();
    });

    window.location = window.location.pathname;
}

async function getCurrentUserInfo() {
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
    openUserMedia();

    if (params.get('roomId')) {
        console.log('Done');
        document.querySelector('#room-id').value = params.get('roomId');
        joinRoom();
    }
    document.querySelector('#hangupBtn').addEventListener('click', hangUp);
    document.querySelector('#createBtn').addEventListener('click', createRoom);
    document.querySelector('#joinBtn').addEventListener('click', joinRoom);
    document.querySelector('#localVideoShowButton').addEventListener('click', showLocalVideo);
    document.querySelector('#cameraOptions').addEventListener('click', cameraDropdown);

    let isFullscreen = false;
    document.getElementById('appFullscreenButton').addEventListener('click', () => {
        if (!isFullscreen) {
            isFullscreen = true;
            openFullscreen(document.body);
            document.getElementById('appFullscreenButton').classList.add('toggle');
            document.getElementById('appFullscreenButton').innerText = 'fullscreen_exit';
        } else {
            isFullscreen = false;
            closeFullscreen();
            document.getElementById('appFullscreenButton').classList.remove('toggle');
            document.getElementById('appFullscreenButton').innerText = 'fullscreen';
        }
    })
    hideNavBarOnTap();

    muteToggleEnable();
    videoToggleEnable();

    var eventName = isiOS ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, function () {
        document.getElementById('hangupBtn').click();
    });

}

init();
