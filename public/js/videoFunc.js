/* 
    * Kamera, Ekran paylaşımı veya microfonla alakalı fonksiyonları içerir
    * Buradaki fonksiyonlar genelde app.js içinde çağırılır.
*/

//! ---------------------------------------- START AND STOP CAPTURE -----------------------------------
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

//!------------------------------------------------------ VİDEO AND MİC----------------------------------
/*
    * 'videocam' butonuna basıldığında kamera stream'indeki görüntüyü durdurur ve ekrandaki güncellemeleri yapar
    TODO: localVideo.srcObject trackleri'ni kesdiğimizden ekran paylaşımı duruyor.-> Düzeltildi ama başka bir problem çıkarıp çıkarmadığı test edilmedi.
    TODO: ekran değişikliklerini style.js ve yeni bir js dosyasında yap buradan ulaşım olmasın
*/
function videoToggleEnable() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.", " Bu fonksiyon tetikleyici içerir.");
    
    document.getElementById('videoButton').addEventListener('click', () => {
        if (videoState) {
            videoState = false;
            cameraStream.getVideoTracks()[0].enabled = false;
            document.querySelector('#videoButton').innerText = "videocam_off";
            document.getElementById('videoButton').classList.add('toggle');
        } else {
            videoState = true;
            cameraStream.getVideoTracks()[0].enabled = true;
            document.querySelector('#videoButton').innerText = "videocam";
            document.querySelector('#videoButton').classList.remove('toggle');
        }
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/*
    * muteButton butonuna basılmasını dinler muteState durumuna göre sesi açar veya kapatır.
    TODO: Butonun UI tasarım değişikliği gerekli yerde yapılmalı
    TODO: kameraStream'in global kalmasına gereksiz olabilir, bunu denemelisin
*/
function muteToggleEnable() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    document.querySelector('#muteButton').addEventListener('click', () => {
        if (!muteState) {
            console.log("Muting");
            muteState = true;
            cameraStream.getAudioTracks()[0].enabled = false;
            document.querySelector('#muteButton').innerText = "mic_off";
            document.getElementById('muteButton').classList.add('toggle');
        } else {
            console.log("Unmuting");
            muteState = false;
            cameraStream.getAudioTracks()[0].enabled = true;
            document.querySelector('#muteButton').innerText = "mic";
            document.getElementById('muteButton').classList.remove('toggle');
        }
    });
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}


/**
    * muteState (mikrofonun kapatılması durumu) değiştiğinde bunu firebase'e kaydetmek için kullanıldı
    * Bu sayede diğer kullanıcılar bu kullanıcının mikrofonunu kapattığını bilebilecekler
    *TODO: Burada tıklanıldımı diye kontrol etmek yerine zaten kontrol edilen yerde (muteToggleEnable) yap veya bu fonksiyonu çağır
*/
function mutingStateChangeInFirebase(roomRef) {
    document.querySelector('#muteButton').addEventListener('click', () => {
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
function videoStateChangeInFirebase(roomRef) {
    document.querySelector('#videoButton').addEventListener('click', () => {
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
function toggleOnContent(roomRef) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    document.getElementById('localVideo').srcObject = captureStream;
    document.getElementById('screenShareButton').innerText = "stop_screen_share";
    document.getElementById('screenShareButton').classList.add('toggle');
    signalContentShare(roomRef);
    screenState = true;
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
function contentToggleOff(roomRef) {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    
    roomRef.collection('partyList').doc(contentId).delete();
    stopCapture(captureStream);
    document.getElementById('localVideo').srcObject = cameraStream;
    screenState = false;
    document.getElementById('screenShareButton').innerText = 'screen_share';
    document.getElementById('screenShareButton').classList.remove('toggle');
    
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
}

/**
    ** Ekrandaki ekran paylaşımı butonunu dinliyor, butona basıldığında ekran paylaşımı açıksa kapatır, 
    ** değilse önce ekran kaydını başlatır ardından bunu firebase'e bildirir.
 */
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