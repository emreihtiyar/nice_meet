/* 
    * Kamera, Ekran paylaşımı veya microfonla alakalı fonksiyonları içerir
    * Buradaki fonksiyonlar genelde app.js içinde çağırılır.
*/


function isHandheld() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    console.log(arguments.callee.name, " Fonksiyonun sonundayız.");
    return check;
};

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