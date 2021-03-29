mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));

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

//let peerConnection = null;
let localStream = null;
let remoteStream = null;
//let remoteStream2 = null;
let roomDialog = null;
let roomId = null;

let connectedCandidates = [];
let peerConnections = [];
let sesionDescriptions = {};
let remoteStreams = [];

function init() {
  document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
  document.querySelector('#hangupBtn').addEventListener('click', hangUp);
  document.querySelector('#createBtn').addEventListener('click', createRoom);
  document.querySelector('#joinBtn').addEventListener('click', joinRoom);
  roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));
}

async function createRoom() {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;
  const db = firebase.firestore();
  const roomRef = await db.collection('rooms').doc();

  console.log('satir-36 Create PeerConnection with configuration: ', configuration);
  peerConnections.push(new RTCPeerConnection(configuration));

  console.log("satir-39 registerPeerConnectionListeners cagiriliyor.... <CreateRoom>");
  registerPeerConnectionListeners();

  localStream.getTracks().forEach(track => {
    peerConnections.forEach(peerConnection => {
      peerConnection.addTrack(track, localStream);
    });
  });

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = roomRef.collection('callerCandidates');

  peerConnections.forEach(peerConnection => {
    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('satir-51 Got final candidate!');
        return;
      }
      console.log('satir-54 Got candidate: ', event.candidate);
      callerCandidatesCollection.add(event.candidate.toJSON());
    });
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  let offer = null;
  /*await peerConnections.forEach(async (peerConnection) =>{
    offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('satir-62 Created offer:', offer);
  });*/
  for (const peerConnection of peerConnections) {
    offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('satir-62 Created offer:', offer);
  }

  console.log('satir-62 Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await roomRef.set(roomWithOffer);
  roomId = roomRef.id;
  console.log(`satir-72 New room created with SDP offer. Room ID: ${roomRef.id}`);
  document.querySelector(
    '#currentRoom').innerText = `Current room is ${roomRef.id} - You are the caller!`;
  // Code for creating a room above

  peerConnections.forEach(peerConnection => {
    peerConnection.addEventListener('track', event => {
      console.log('satir-78 Got remote track:', event.streams[0]);

      event.streams[0].getTracks().forEach(track => {
        console.log('satir-81 Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      });
    });
  });

  // Listening for remote session description below
  // Uzaktan aciklama aldiginda buraya dusuyor
  roomRef.onSnapshot(async snapshot => {
    const data = snapshot.data();
    console.log('Satir-90 Room Snapshot');
    console.log('peerConnections len: ',peerConnections.length);
    console.log('peerConnections',peerConnections);
    for (const peerConnection of peerConnections) {
      console.log('peerConnection',peerConnection);
      console.log('peerConnection.currentRemoteDescription:', peerConnection.currentRemoteDescription);
      console.log('data:', data);
      console.log('data.answer:', data.answer);
    }

    //
    for (const peerConnection of peerConnections) {
      if (!peerConnections[0].currentRemoteDescription && data && data.answer) {
        console.log('satir-92 Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(rtcSessionDescription);
        sesionDescriptions[peerConnection] = rtcSessionDescription
      }
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === 'added') {
        let data = change.doc.data();
        console.log(`satir-104 Got new remote ICE candidate: ${JSON.stringify(data)}`);
        for (const peerConnection of peerConnections) { //Biri baglanmaya calisinca buraya geliyor
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          if (/*!peerConnections[0].currentRemoteDescription && */data && data.answer) {
            console.log('satir-107 Got remote description: ', data.answer);
            const rtcSessionDescription = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(rtcSessionDescription);
            sesionDescriptions[peerConnection] = rtcSessionDescription;
          }
        }
      }
    });
  });
  // Listen for remote ICE candidates above
}

function joinRoom() {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;

  document.querySelector('#confirmJoinBtn').addEventListener('click', async () => {
      roomId = document.querySelector('#room-id').value;
      console.log('satir-124 Join room: ', roomId);
      document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the callee!`;
      await joinRoomById(roomId);
    }, { once: true });
  roomDialog.open();
}

async function joinRoomById(roomId) {
  const db = firebase.firestore();
  const roomRef = db.collection('rooms').doc(`${roomId}`);
  const roomSnapshot = await roomRef.get();
  console.log('satir-136 Got room:', roomSnapshot.exists);

  if (roomSnapshot.exists) {
    console.log('satir-139 Create PeerConnection with configuration: ', configuration);
    peerConnections.push(new RTCPeerConnection(configuration));
    console.log("satir-141 registerPeerConnectionListeners cagiriliyor.... <JoinRoomById>");
    registerPeerConnectionListeners();
    localStream.getTracks().forEach(track => {
      peerConnections.forEach(peerConnection => {
        peerConnection.addTrack(track, localStream);
      });
    });

    // Code for collecting ICE candidates below
    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    peerConnections.forEach(peerConnection => {
      peerConnection.addEventListener('icecandidate', event => {
        if (!event.candidate) {
          console.log('satir-151 Got final candidate!');
          return;
        }
        console.log('satir-154 Got candidate: ', event.candidate);
        calleeCandidatesCollection.add(event.candidate.toJSON());
      });
    });

    // Code for collecting ICE candidates above

    peerConnections.forEach(peerConnection => {
      peerConnection.addEventListener('track', event => {
        console.log('satir-160 Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('satir-162 Add a track to the remoteStream:', track);
          remoteStream.addTrack(track);
        });
      });
    });

    // Code for creating SDP answer below
    const offer = roomSnapshot.data().offer;
    console.log('satir-169 Got offer:', offer);
    let answer = null;
    for (const peerConnection of peerConnections) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      answer = await peerConnection.createAnswer();
      console.log('satir-172 Created answer:', answer);
      await peerConnection.setLocalDescription(answer);
    }

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await roomRef.update(roomWithAnswer);
    // Code for creating SDP answer above

    // Listening for remote ICE candidates below
    roomRef.collection('callerCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`satir-189 Got new remote ICE candidate: ${JSON.stringify(data)}`);
          for (const peerConnection of peerConnections) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        }
      });
    });
    // Listening for remote ICE candidates above
  }
}

async function openUserMedia(e) {
  const stream = await navigator.mediaDevices.getUserMedia(
    { video: true, audio: false }); //ses ve goruntunun hangilerininn iletileceginibelirliyoruz.
  document.querySelector('#localVideo').srcObject = stream;
  localStream = stream;
  remoteStream = new MediaStream();
  document.querySelector('#remoteVideo').srcObject = remoteStream;
  document.querySelector('#remoteVideo2').srcObject = remoteStream; //video objesine akis ekliyor, akis bos olsada

  console.log('Stream:', document.querySelector('#localVideo').srcObject);
  document.querySelector('#cameraBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = false;
  document.querySelector('#createBtn').disabled = false;
  document.querySelector('#hangupBtn').disabled = false;
}

async function hangUp(e) {
  const tracks = document.querySelector('#localVideo').srcObject.getTracks();
  tracks.forEach(track => {
    track.stop();
  });

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnections[0]) {
    peerConnections[0].close();
  }

  document.querySelector('#localVideo').srcObject = null;
  document.querySelector('#remoteVideo').srcObject = null;
  document.querySelector('#cameraBtn').disabled = false;
  document.querySelector('#joinBtn').disabled = true;
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#hangupBtn').disabled = true;
  document.querySelector('#currentRoom').innerText = '';

  // Delete room on hangup
  if (roomId) {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc(roomId);
    const calleeCandidates = await roomRef.collection('calleeCandidates').get();
    calleeCandidates.forEach(async candidate => {
      await candidate.ref.delete();
    });
    const callerCandidates = await roomRef.collection('callerCandidates').get();
    callerCandidates.forEach(async candidate => {
      await candidate.ref.delete();
    });
    await roomRef.delete();
  }

  document.location.reload(true);
}

function registerPeerConnectionListeners() {
  peerConnections[0].addEventListener('icegatheringstatechange', () => {
    console.log(
      `satir-257 ICE gathering state changed: ${peerConnections[0].iceGatheringState}`);
  });

  peerConnections[0].addEventListener('connectionstatechange', () => {
    console.log(`satir-261 Connection state change: ${peerConnections[0].connectionState}`);
  });

  peerConnections[0].addEventListener('signalingstatechange', () => {
    console.log(`satir-265 Signaling state change: ${peerConnections[0].signalingState}`);
  });

  peerConnections[0].addEventListener('iceconnectionstatechange ', () => {
    console.log(
      `270 ICE connection state change: ${peerConnections[0].iceConnectionState}`);
  });
}

init();
