/* 
    * Kamera, Ekran paylaşımı veya microfonla alakalı fonksiyonları içerir
    * Buradaki fonksiyonlar genelde app.js içinde çağırılır.
*/

//! ---------------------------------------- START AND STOP CAPTURE AND CHANGE CAMERA -----------------------------------
/**
    ** Aldığı ayarlarla tarayıcı yardımı ile ekran paylaşımını (stream) laır ve captureStream'e ekler
    *@return {Ekran kaydını geri döndürür.}.
*/
async function startCapture(displayMediaOptions) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    let captureStream = null;
    captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    
    return captureStream;
}

/*
    * Aldığı STREAM'in tracklerininin tamamını durdurur ve aldığı stream'i null olarak atar. 
*/
function stopCapture(stream) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    let tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    stream = null;
    
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
        document.getElementById('local-video').srcObject = stream;
        cameraStream = stream
    });
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}
//!------------------------------------------------------ VİDEO AND MİC----------------------------------
/*
    * 'videocam' butonuna basıldığında kamera stream'indeki görüntüyü durdurur ve ekrandaki güncellemeleri yapar
    TODO: localVideo.srcObject trackleri'ni kesdiğimizden ekran paylaşımı duruyor.-> Düzeltildi ama başka bir problem çıkarıp çıkarmadığı test edilmedi.
    TODO: ekran değişikliklerini style.js ve yeni bir js dosyasında yap buradan ulaşım olmasın
*/
function videoToggleEnable() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    if (videoState) {
        videoState = false;
        cameraStream.getVideoTracks()[0].enabled = false;
        document.querySelector('#video-btn').innerText = "videocam_off";
        document.getElementById('video-btn').classList.add('toggle');
    } else {
        videoState = true;
        cameraStream.getVideoTracks()[0].enabled = true;
        document.querySelector('#video-btn').innerText = "videocam";
        document.querySelector('#video-btn').classList.remove('toggle');
    }

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/*
    * mute-btn butonuna basılmasını dinler muteState durumuna göre sesi açar veya kapatır.
    TODO: Butonun UI tasarım değişikliği gerekli yerde yapılmalı
    TODO: kameraStream'in global kalmasına gereksiz olabilir, bunu denemelisin
*/
function muteToggleEnable() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    if (!muteState) {
        console.log("Muting");
        muteState = true;
        cameraStream.getAudioTracks()[0].enabled = false;
        document.querySelector('#mute-btn').innerText = "mic_off";
        document.getElementById('mute-btn').classList.add('toggle');
    } else {
        console.log("Unmuting");
        muteState = false;
        cameraStream.getAudioTracks()[0].enabled = true;
        document.querySelector('#mute-btn').innerText = "mic";
        document.getElementById('mute-btn').classList.remove('toggle');
    }

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


/**
    * muteState (mikrofonun kapatılması durumu) değiştiğinde bunu firebase'e kaydetmek için kullanıldı
    * Bu sayede diğer kullanıcılar bu kullanıcının mikrofonunu kapattığını bilebilecekler
    *TODO: Burada tıklanıldımı diye kontrol etmek yerine zaten kontrol edilen yerde (muteToggleEnable) yap veya bu fonksiyonu çağır
*/
function mutingStateChangeInFirebase() {
    document.querySelector('#mute-btn').addEventListener('click', () => {
        roomRef.collection('partyList').doc(currentUser.uid).update({
            'muteState': muteState
        });
    });
}

/**
    * videoState (kamera durumu) değiştiğinde bunu firebase'e kaydetmek için kullanıldı
    * Bu sayede diğer kullanıcılar bu kullanıcının kamerasını kapattığını bilebilecekler
    *TODO: Burada tıklanıldımı diye kontrol etmek yerine zaten kontrol edilen yerde (videoToggleEnable) yap veya bu fonksiyonu çağır
*/
function videoStateChangeInFirebase() {
    document.querySelector('#video-btn').addEventListener('click', () => {
        roomRef.collection('partyList').doc(currentUser.uid).update({
            'videoState': videoState
        });
    });
}

//!----------------------------------------------------- CONTENT ------------------------------------
/*
    *Ekran paylaşımı açmaya yarar localVideo'ya bu paylaşımı koyar ve tuşları değiştirir.
    *signalContentShare ile paylaşımı açtığını firebase'e yani diğer peerlara bildirir.
    TODO: ekran değişikliklerini style.js ve yeni bir js dosyasında yap buradan ulaşım olmasın
    TODO: Gerekli görülmesi Halinde roomRef'i global bir değişken yap ki buraya onun alınmasına gerek kalınmasın
    TODO: localVideo yerine başka şekilde göster. ->Bunu yeni arayüz ilede yapabilirsin
*/
function toggleOnContent() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");

    screenVideo = document.getElementById('local-video').cloneNode();
    screenVideo.id = "local-screen-video";
    screenVideo.muted = true;
    screenVideo.srcObject = captureStream;
    document.getElementById('local-video-container').appendChild(screenVideo);

    document.getElementById('screen-share-btn').innerText = "stop_screen_share";
    document.getElementById('screen-share-btn').classList.add('toggle');
    signalContentShare();
    contentState = true;
    captureStream.getVideoTracks()[0].onended = () => {
        contentToggleOff(roomRef);
    }
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/*
* Ekran paylaşımını kapatmak için kullanılır, paylaşımı durdurur ve firebase'deki paylaşım olan content değerini siler
    TODO: ekran değişikliklerini style.js ve yeni bir js dosyasında yap buradan ulaşım olmasın
    TODO: firebase'deki content değerini silmesi için başka bir fonksiyon kullanabilirsin (roomRef global olması gerekebilir)
*/
function contentToggleOff() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    roomRef.collection('partyList').doc(contentId).delete();
    stopCapture(captureStream);
    //document.getElementById('local-video').srcObject = cameraStream;
    document.getElementById('local-screen-video').remove();
    contentState = false;
    document.getElementById('screen-share-btn').innerText = 'screen_share';
    document.getElementById('screen-share-btn').classList.remove('toggle');
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    ** Ekrandaki ekran paylaşımı butonunu dinliyor, butona basıldığında ekran paylaşımı açıksa kapatır, 
    ** değilse önce ekran kaydını başlatır ardından bunu firebase'e bildirir.
 */
async function contentToggleButton() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    if (!contentState) {
        const displayMediaOptions = {
            video: {
                cursor: "always"
            },
            audio: false
        };
        try {
            console.log('Toggling screen share');
            captureStream = await startCapture(displayMediaOptions);
            toggleOnContent();
        } catch (error) {
            console.log(error.message);
        }
    } else {
        contentToggleOff();
    }
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

//!-------------------------------------------- SEND OR RECİEVE STREAM, OTHER PEERS ------------------
/**
    ** Parametre olarak aldığı peer'ın track'lerini dinler ve eğer track eklenirse bu peer için arayüzde video oluşturur.
    *TODO: arayüz ile ilgili işlemleri burada yapmak yerine bunu farklı bir fonksiyonda yapmak daha mantıklı (createPeerVideo var ancak stream burada atanıyor)
 */
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

/**
    ** Parametre olarak aldığı peer'a aldığı stream'i gönderir bu sayede diğer peer'a video ulaştırılır
 */
function sendStream(peerConnection, stream) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

//!------------------------------------------------ User Media -------------------------------------------------

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
        }).catch(error => {
        console.log("kamera açma hatası: ", error);
        createSideAlert("Kamera Açılamadı, Lütfen kamera ve mikrofon kullanım iznini verniniz, eğer verdiyseniz kamerayı kullanan diğer uygulamaları kapatınız ve sayfayı yenileyiniz.", "warning", 1000);
        createSideAlert("Kamera ve Mikrofon izni olmadan bu uygulama kullanılamaz.", "warning", 1000);
        document.getElementById("buttons").style.display = "none";
    });;

    document.querySelector('#local-video').srcObject = cameraStream;
    document.querySelector('#local-video').muted = true;

    console.log('Stream:', document.querySelector('#local-video').srcObject);
    document.querySelector('#join-btn').classList.remove("hidden");
    document.querySelector('#create-btn').classList.remove("hidden");

    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}