/*
    *Peer'lar ve PeerConnection üzerindeki işlemler burada olacaktır.
    *Buradaki fonksiyonlar genelde bu dosya veya app.js içinde çağırılır.
*/

/* 
    *parametre olarak aldığı peerConnention'a, yine parametre olarak aldığı stream'i ekler
    *Stream doğrudan eklenmez stream'in içindeki trackleri(ses, video vb.) teker teker ekler.
*/
function addStream(peerConnection, stream) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}
//!---------------------------------------- ICE Candidate ---------------------------
/**
 *? ICE Candidate -> (ICE isteği) -> ARAŞTIR.
 ** parametre olarak aldığı peerConnection'daki ICE candidate değişikliklerini topluyor ve,
 ** bu ICE candidate'leri firebase'de kendi koleksiyonunun altındaki Connection->ICECandidates içine yazıyor.
 */
function signalICECandidates(peerConnection, roomRef, peerId, nameId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    const callerCandidatesCollection = roomRef.collection(nameId).doc("Connections").collection("ICECandidates");
    
    peerConnection.addEventListener('icecandidate', event => {
        if (!event.candidate) {
            console.log('Got final candidate!');
            return;
        }
        console.log('Got candidate: ', event.candidate);
        callerCandidatesCollection.add(event.candidate.toJSON()).then(docRef => {
            docRef.update({
                name: peerId
            })
        });
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
 *? ICE Candidate -> (ICE isteği) -> ARAŞTIR.
 ** Aldığı remoteEndpointID (uzaktaki peerın id'si) ile firebase'de o kullanıcının kaydettiği ICE candidate'lerini topluyor.
 *TODO:DETAYLI BAK.
 */
async function receiveICECandidates(peerConnection, roomRef, remoteEndpointID, nameId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    roomRef.collection(remoteEndpointID).doc("Connections").collection("ICECandidates").where("name", "==", nameId).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
            if (change.type === 'added' && change.doc.id != "SDP") {
                console.log("ICEcandiate change",change);
                let data = change.doc.data();
                console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                await peerConnection.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}
//!---------------------------------------- OFFER Aand ANSWER (create, send, receive) ---------------------------
/*
    *Aldığı peerConnection nesnesine özel bir Offer (Teklif) oluşturuyor.
    *Ayrıca oluşturduğu offer'ı peerConnectionın Local açıklaması olarak ekleniyor, gerekirse her peer'ın local açıklamasını bu sayede öğrenebiliriz
    *preferCodec -> bu sdp'de hangi codec'i tercih edeceğimizi belirlemede yardımcı oluyor.
*/
async function createOffer(peerConnection) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Created offer:', offer);
    offer.sdp = preferCodec(offer.sdp, "h264");
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    
    return offer;
}

/*
    *Aldığı peerConnection nesnesine özel bir answer (cevap) oluşturuyor. (kullnıldığı yerde gelen isteğe karşılık çağırılır)
    *Ayrıca oluşturduğu answer'ı peerConnectionın Local açıklaması olarak ekleniyor, gerekirse her peer'ın local açıklamasını bu sayede öğrenebiliriz
    *preferCodec -> bu answer'ın sdp'sinde hangi codec'i tercih edeceğimizi belirlemede yardımcı oluyor.
*/
async function createAnswer(peerConnection) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);
    answer.sdp = preferCodec(answer.sdp, "h264");
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    
    return answer
}
/**
    ** Parametre olarak aldığı offer bilgisi firebase'e bulunulan odadaki kendi id'sini taşıyan koleksiyon altında SDP dökümanına kaydediyor.
    ** İçerik sunan (content) kişi ise bunuda ekliyor ancak bunun offer altına ama en içteki offerın yanına ekliyor
    * TODO: nameId'değişkeni neye göre geliyor bu olmasa nasıl yapılır, bağlantıda rasgele oluşmak dısışda işi varmı?
*/
async function sendOffer(offer, roomRef, peerId, nameId, isUserContent) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    const peerOffer = {
        'offer': {
            type: offer.type,
            sdp: offer.sdp,
            display: 'user'
        },
    };
    
    if (isUserContent) {
        peerOffer.display = 'content';
    }
    
    await roomRef.collection(peerId).doc('SDP').collection('offer').doc(nameId).set(peerOffer);
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    ** Parametre olarak aldığı answer bilgisi firebase'e bulunulan odadaki kendi id'sini taşıyan koleksiyon altında SDP dökümanına kaydediyor.
    ** İçerik sunan (content) kişi ise bunuda ekliyor ancak bunun answer altına ama en içteki answerın yanına ekliyor
    * TODO: nameId'değişkeni neye göre geliyor bu olmasa nasıl yapılır, bağlantıda rasgele oluşmak dısışda işi varmı?
*/
async function sendAnswer(answer, roomRef, peerId, nameId, isUserContent) {
    const peerAnswer = {
        'answer': {
            type: answer.type,
            sdp: answer.sdp,
            display: 'user'
        },
    };
    if (isUserContent) {
        peerAnswer.display = 'content';
    }
    await roomRef.collection(peerId).doc('SDP').collection('answer').doc(nameId).set(peerAnswer);
}

/**
    **Firebase'de nameId (diğer peer) içine SDP/offer altında kendi peerId'mizi içeren dökümanı arıyoruz bu döküman eklendiğinde,
    ** buradan aldğımız offer diğer peer'ın bize gönderdiği offerdır(istek). Bu istekteki bilgilerle aldığımız peerConnection nesnesinin,
    ** uzak açıklamasını ekliyoruz.
    * (bu sayede bu peerConnection nesnesinden asnwer oluşturulduğunda remoteDescription'a bakarak uygun answer'ı(cevabı) oluşturuyor)
*/
async function receiveOffer(peerConnection, roomRef, peerId, nameId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    await roomRef.collection(nameId).doc('SDP').collection('offer').doc(peerId).get().then(async snapshot => {
        if (snapshot.exists) {
            const data = snapshot.data();
            const offer = data.offer;
            console.log('Got offer:', offer);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        }
    });

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    **Firebase'de nameId (diğer peer) içine SDP/answer altında kendi peerId'mizi içeren dökümanı arıyoruz bu döküman eklendiğinde,
    ** buradan aldğımız answer diğer peer'ın bize gönderdiği answerdır(cevap). Bu istekteki bilgilerle aldığımız peerConnection nesnesinin,
    ** uzak açıklamasını ekliyoruz.
    * (bu sayede bu peerConnection bağlantı için bilgilerimiz oluyor.)
*/
async function receiveAnswer(peerConnection, roomRef, peerId, nameId) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    roomRef.collection(nameId).doc('SDP').collection('answer').doc(peerId).onSnapshot(async snapshot => {
        if (snapshot.exists) {
            const data = snapshot.data();
            console.log('Got remote description: ', data.answer);
            const rtcSessionDescription = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(rtcSessionDescription);
        }
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/** 
    ** peerConnection nesnesi oluşturur bu peer'a stream göndermeyi başlatır, ve bu peer için ICE siteklerini toplamaya başlar ve topladıklarını firebase'e kaydeder
    ** bu peer'a istek(offer) oluşturur ve *sendOffer* ile bu offer'ı gönderir
    ** bu peer'dan gelecek stream ve answer(cevap)'ları ve ICE isteklerini toplar
    ** önce ekrandaki hangup butonuna dinyelici yerleştirir ve bağlantının kapanmasını ve yeniden başlatılmasını dinlemeye başlar
 */
async function peerRequestConnection(peerId, roomRef, nameId, isUserContent, isPeerContent) {
    console.log('Create PeerConnection with configuration: ', configuration);

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnectionStateLintener(peerConnection);

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

/**
    ** peerConnection nesnesi oluşturur bu peer'a stream göndermeyi başlatır, ve bu peer için ICE siteklerini toplamaya başlar ve topladıklarını firebase'e kaydeder
    ** Eğer sunan kişi değilse stream'leri toplar
    ** offer(istek)'leri toplar ve her bir isteğe answer(cevap) oluşturur. Oluşturduğu cevabı gönderir ve ICE isteklerini toplar
    ** önce ekrandaki hangup butonuna dinyelici yerleştirir ve bağlantının kapanmasını ve yeniden başlatılmasını dinlemeye başlar
*/
async function peerAcceptConnection(peerId, roomRef, nameId, isPeerContent, isUserContent) {
    console.log('Create PeerConnection with configuration: ', configuration)
    
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionStateLintener(peerConnection);

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

/**
    ** Aldığı peer'ın bağlantısının kesilmesi durmunda  yeniden bağlanmaya çalışır
 */
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

/**
    ** Karşıdaki kişi firebase partyList'den ayrıldıysa veya ICE bağlantısı keslmişse bu durumda odadan ayrıldı demektir,
    ** bu durumda arayüzden bu kişinin videosu kaldırılmalı, 
    ** eğer bu kişi sunan kişi ise o zaman arayüzden bu sunumda kaldırılmalı ve bu durumu tutan değişkenler yenilenmeli.
 */
    function closeConnection(peerConnection, roomRef, peerId) {
        console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
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
    
        console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    }

/**
    ** Aldığı peer'ın bazı durumlarını dinler ve durum değişikliklerinde ekrana yazdırır, dinlediği durumlar
    *@param {icegatheringstatechange} ->
    *@param {connectionstatechange} ->
    *@param {signalingstatechange} ->
    *@param {iceconnectionstatechange} ->
 */
function peerConnectionStateLintener(peerConnection) {
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