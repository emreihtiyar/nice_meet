let numberOfDisplayedPeers = 0;

let chatBarIsOpen = false;
let usersBarIsOpen = false;

function enforceLayout(numberOfDisplayedPeers) {
    if (!isContentExists) {
        gridLayout(numberOfDisplayedPeers);
    } else {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('sixteen_cell');
        document.getElementById('local-video-container').classList.remove('side-local-video');
    }
}

function gridLayout(numberOfDisplayedPeers) {
    document.querySelectorAll('.video-box').forEach(elem => {
        if (!elem.classList.contains('content-container')) {
            elem.classList.remove('hidden');
        }
    });

    if (numberOfDisplayedPeers == 1) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementById('local-video-container').classList.add('side-local-video');
    } else if (numberOfDisplayedPeers == 2) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('two_cell');
        document.getElementById('local-video-container').classList.add('side-local-video');
    } else if (numberOfDisplayedPeers > 2 && numberOfDisplayedPeers <= 4) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('four_cell');
        document.getElementById('local-video-container').classList.add('side-local-video');
    } else if (numberOfDisplayedPeers > 4 && numberOfDisplayedPeers <= 9) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('nine_cell');
        document.getElementById('local-video-container').classList.add('side-local-video');
    } else if (numberOfDisplayedPeers > 9) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('sixteen_cell');
        document.getElementById('local-video-container').classList.add('side-local-video');
    } else {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementById('local-video-container').classList.remove('side-local-video');
    }
}

function swipeContent() {
    if (isContentShown) {
        isContentShown = false;
        document.getElementsByClassName('content-container')[0].classList.add('hidden');
        gridLayout(numberOfDisplayedPeers - 1);
    } else {
        isContentShown = true;
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementsByClassName('content-container')[0].classList.remove('hidden');
        document.querySelectorAll('.video-box').forEach(elem => {
            if (!elem.classList.contains('content-container')) {
                elem.classList.add('hidden');
            }
        });
    }
}

function createPeerVideo(peerId, isPeerContent) {
    const peerNode = document.getElementsByClassName('video-box')[0].cloneNode();
    peerNode.appendChild(document.getElementById('local-video').cloneNode());

    peerNode.id = 'video' + peerId + 'Container';
    peerNode.firstElementChild.id = 'video' + peerId;

    peerNode.classList.remove('side-local-video');
    peerNode.classList.remove('relaxed-hidden');

    if (isPeerContent) {
        let inFullscreen = false;
        isContentShown = true;
        isContentExists = true;
        peerNode.classList.add('content-container');
        peerNode.addEventListener('click', () => {
            if (inFullscreen) {
                inFullscreen = false;
                screen.orientation.unlock();
                closeFullscreen();
            } else {
                inFullscreen = true;
                screen.orientation.lock('landscape').then(console.log('Locked landscape'));
                openFullscreen(peerNode)
            }
        });
    }
    
    console.log(peerNode);
    document.getElementById('videos').appendChild(peerNode);

    document.getElementById('video' + peerId).srcObject = new MediaStream();

    enforceLayout(++numberOfDisplayedPeers);
}

function openFullscreen(video) {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) { /* Firefox */
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { /* IE/Edge */
        video.msRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}

function hideLocalVideo() {
    if (numberOfDisplayedPeers > 0) {
        localVideoElem = document.getElementById('local-video-container');
        localVideoElem.classList.add('relaxed-hidden');
        document.getElementById('local-video-show-btn').classList.remove('hidden'); 
    }
}

function showLocalVideo() {
    localVideoElem = document.getElementById('local-video-container');
    localVideoElem.classList.remove('relaxed-hidden');
    document.getElementById('local-video-show-btn').classList.add('hidden'); 
}

function hideNavBarOnTap() {
    document.addEventListener("click", () => {
        document.getElementById("buttons").classList.add("unhover");
    });
}

function cameraDropdown() {
    menu.open = true;
}

//!-----------------------------------------------------------------------------------------------------------------
//! Bu kısımdan sonrası benim yazımım
function addMessageBubble(senderName, message, date) {
    let bubbleElement = document.createElement("div");
    let senderElement = document.createElement("span");
    let messageElement = document.createElement("span");
    let timeElement = document.createElement("span");

    bubbleElement.classList.add("message-bubble");
    senderElement.classList.add("message-sender");
    messageElement.classList.add("message-text");
    timeElement.classList.add("message-time");

    senderElement.innerHTML = senderName;
    messageElement.innerHTML = message;
    timeElement.innerHTML = date.getHours().toString()+":"+date.getMinutes().toString();

    bubbleElement.appendChild(senderElement);
    bubbleElement.appendChild(messageElement);
    bubbleElement.appendChild(timeElement);

    document.getElementById("chat-bar").appendChild(bubbleElement);
}

function addUserBubble(uid,username, displayInfo, muteState, cameraState) {
    let bubbleElement = document.createElement("div");
    let usernameElement = document.createElement("span");
    let cameraIcon = document.createElement("span");
    let micIcon = document.createElement("span");
    let screenShareIcon = document.createElement("span");

    bubbleElement.id = uid;
    
    bubbleElement.classList = "user-bubble";
    usernameElement.classList = "user-info-username";
    cameraIcon.classList = "material-icons camera-icon";
    micIcon.classList = "material-icons mic-icon";
    screenShareIcon.classList = "material-icons cast-icon";

    if (cameraState) {
        cameraIcon.innerHTML = "videocam";
    }
    else{
        cameraIcon.innerHTML = "videocam_off";
    }
    if (muteState) {
        micIcon.innerHTML = "mic_off";
    } else {
        micIcon.innerHTML = "mic";
    }
    if (displayInfo === "content") {
        cameraIcon.style.visibility = "hidden"
        micIcon.style.visibility = "hidden"
        screenShareIcon.innerHTML = "screen_share";
    }

    usernameElement.innerHTML = username;

    bubbleElement.appendChild(usernameElement);
    bubbleElement.appendChild(cameraIcon);
    bubbleElement.appendChild(micIcon);
    bubbleElement.appendChild(screenShareIcon);

    document.getElementById("users-bar").appendChild(bubbleElement);
}

function deleteUserBubble(uid) {
    let bubbleElement = document.getElementById(uid);
    if (bubbleElement != null && bubbleElement != undefined) {
        bubbleElement.remove();
    }
}

function changeUserBubbleDetails(uid, muteState, cameraState) { //document.querySelector('#div1 #demo').innerHTML = "Hello World!";
    let bubbleElement = document.getElementById(uid);

    let cameraIcon;
    let micIcon;

    bubbleElement.childNodes.forEach(function (child) {  
        if (child != undefined && child != null && child.childNodes != null) {
            if (child.classList.contains("camera-icon")) {
                cameraIcon = child;
            }else if (child.classList.contains("mic-icon")) {
                micIcon= child;
            }
        }
    });

    if (bubbleElement == null || bubbleElement == undefined) {
        console.log("Böyle Bir Kullanıcı baloncuğu bulunamadı.");
        return undefined;
    }

    if (cameraState) {
        cameraIcon.innerHTML = "videocam";
    }
    else{
        cameraIcon.innerHTML = "videocam_off";
    }
    if (muteState) {
        micIcon.innerHTML = "mic_off";
    } else {
        micIcon.innerHTML = "mic";
    }
}

function createSideAlert(message, type, sec=5, link) {
    let alert = document.createElement("div");
    alert.innerText = message;
    alert.role= "alert";
    switch (type) {
        case "primary":
            alert.classList = "side-alert alert-primary";
            break;
        case "warning":
            alert.classList = "side-alert alert-warning";
            break;
        case "success":
            alert.classList = "side-alert alert-success";
            break;
        default:
            alert.classList = "side-alert alert-primary";
            break;
    }
    document.getElementById("side-alert-container").appendChild(alert);

    setTimeout(() => { 
        alert.remove(); 
        if (link != undefined) {
            window.location.href =link;
        }
    }, (sec*1000));
}


function highlightElement(elementID, second) {
    document.getElementById(elementID).classList.add("border-red");
    setTimeout(() => { 
        document.getElementById(elementID).classList.remove("border-red");
    }, (second*1000));
}

function chatBtnListener() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    if (chatBarIsOpen) {
        document.getElementById("chat-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "none";
        document.getElementById("main-container").classList.remove("main-collapsed");
        chatBarIsOpen = false;
    }else{
        if (usersBarIsOpen) {
            document.getElementById("users-bar").style.display = "none";
            usersBarIsOpen = false;
        }
        document.getElementById("main-container").classList.add("main-collapsed");
        document.getElementById("chat-bar").style.display = "block";
        document.getElementById("users-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "block";
        chatBarIsOpen = true;
    }
}

function usersBtnListener() {
    console.log(arguments.callee.name, " Fonksiyonun başındayız.");
    if (usersBarIsOpen) {
        document.getElementById("users-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "none";
        document.getElementById("main-container").classList.remove("main-collapsed");
        usersBarIsOpen = false;
    }else{
        if (chatBarIsOpen) {
            document.getElementById("chat-bar").style.display = "none";
            chatBarIsOpen = false;
        }
        document.getElementById("main-container").classList.add("main-collapsed");
        document.getElementById("users-bar").style.display = "block";
        document.getElementById("chat-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "block";
        usersBarIsOpen = true;
    }
}

function setUIRoomInfo(roomID, URL){
    document.getElementById("current-room-id").innerText = roomID
    document.getElementById("current-room-URL").innerText = URL;
}

function copyRoomInfo(param) {
    if (param.path[0].id == "current-room-id" || param.path[1].id == "copy-room-id-btn") {
        //Ekranda id'nin üstüne yada id'nin yanındaki kopyala butonuna nasıldıysa
        let roomId = document.getElementById("current-room-id").innerText;
        navigator.permissions.query({ name: "clipboard-write" }).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
                /* write to the clipboard now -- Eğer kopyalamaya izin veriliyorsa*/
                navigator.clipboard.writeText(roomId).then(() => {
                    /* clipboard successfully set */
                    createSideAlert("Kopyalandı.","success", 3);
                    document.querySelector("#copy-room-id-btn span").innerHTML = "done_all";
                }, ()=> {
                    /* clipboard write failed - Kopyalama başarılı değilse */
                    createSideAlert("Otomatik kopyalama başarısız. Tarayıcı bunu desteklemiyor.","warning", 3);
                    document.querySelector("#copy-room-id-btn span").innerHTML = "priority_high";
                });
            }
        });
    } else if (param.path[0].id == "current-room-URL" || param.path[1].id == "copy-room-URL-btn") {
        //Ekranda URL'in üstüne yada URL'nin yanındaki kopyala butonuna nasıldıysa
        let roomURL = document.getElementById("current-room-URL").innerText;
        navigator.permissions.query({ name: "clipboard-write" }).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
                /* write to the clipboard now -- Eğer kopyalamaya izin veriliyorsa*/
                navigator.clipboard.writeText(roomURL).then(() => {
                    /* clipboard successfully set */
                    createSideAlert("Kopyalandı.","success", 3);
                    document.querySelector("#copy-room-URL-btn span").innerHTML = "done_all";
                }, ()=> {
                    /* clipboard write failed - Kopyalama başarılı değilse */
                    createSideAlert("Otomatik kopyalama başarısız. Tarayıcı bunu desteklemiyor.","warning", 3);
                    document.querySelector("#copy-room-URL-btn span").innerHTML = "priority_high";
                });
            }
        });
    }
    setTimeout(()=>{
        document.querySelector("#copy-room-id-btn span").innerHTML = "content_copy";
        document.querySelector("#copy-room-URL-btn span").innerHTML = "content_copy";
    },2000)

}

function addAllListener() {
    document.querySelector('#hangup-btn').addEventListener('click', hangUp);
    document.querySelector('#create-btn').addEventListener('click', createRoom);
    document.querySelector('#join-btn').addEventListener('click', joinRoom);
    document.querySelector('#local-video-show-btn').addEventListener('click', showLocalVideo);
    document.querySelector('#camera-options').addEventListener('click', cameraDropdown);
    document.getElementById("chat-btn").onclick = chatBtnListener;
    document.getElementById("users-btn").onclick = usersBtnListener;
    document.getElementById("record-btn").onclick = recordStartOrStop;
    document.getElementById("video-btn").onclick = videoToggleEnable;
    document.getElementById("mute-btn").onclick = muteToggleEnable;

    document.getElementById("close-front-alert-btn").onclick = () => {     document.getElementById("front-alert-container").classList.add("hidden"); }
    document.getElementById("share-btn").onclick = () => {     document.getElementById("front-alert-container").classList.remove("hidden"); };
    
    document.getElementById("current-room-id").onclick = copyRoomInfo;
    document.getElementById("copy-room-id-btn").onclick = copyRoomInfo;
    document.getElementById("current-room-URL").onclick = copyRoomInfo;
    document.getElementById("copy-room-URL-btn").onclick = copyRoomInfo;

    // Tam ekrana geçmek için 
    //TODO: Tam ekrana geçiş style.js içinde olması daha mantıklı olabilir.
    let isFullscreen = false;
    document.getElementById('full-screen-btn').addEventListener('click', () => {
        if (!isFullscreen) {
            isFullscreen = true;
            openFullscreen(document.body);
            document.getElementById('full-screen-btn').classList.add('toggle');
            document.getElementById('full-screen-btn').innerText = 'fullscreen_exit';
        } else {
            isFullscreen = false;
            closeFullscreen();
            document.getElementById('full-screen-btn').classList.remove('toggle');
            document.getElementById('full-screen-btn').innerText = 'fullscreen';
        }
    })
}

//TODO: >swipeOnlyContent< fonksiyonu çalıştığında sonra bir tane user-video kalıyor nedenini alamadım, ikinci kez çalıştığında kalanda gidiyor
function swipeOnlyContent() {
    let videoContainer = document.getElementById("video-container");
    videoContainer.childNodes.forEach(child => { 
        if (child.classList != undefined && child.classList.contains("user-video")) {
            videoContainer.removeChild(child);
        }
    });
    videoContainer.classList = "video-container video-container-only-content";
}

function swipeContentAndUsers() {
    let videoContainer = document.getElementById("video-container");
    videoContainer.classList = "video-container video-container-content";
}

function swipeOnlyUsers() {
    let videoContainer = document.getElementById("video-container");
    videoContainer.childNodes.forEach((child) => { 
        if (child.classList != undefined && child.classList.contains("content-video")) {
            videoContainer.removeChild(child);
        }
    });
    enforceGridLayout(numberOfDisplayedPeers);
}

function addPeerVideo(peerID, videoSource){
    let videoContainer = document.getElementById("video-container");
    let userVideo = document.createElement("div");
    let videoElement = document.createElement("video");

    userVideo.classList.add("user-video");
    videoElement.id = "video"+`${peerID}`;
    if (videoSource == null || videoSource == undefined) {
        videoElement.src = "videos/sample_640x360.webm"
    } else {
        videoElement.srcObject = videoSource;
    }

    userVideo.appendChild(videoElement);
    videoContainer.appendChild(userVideo);
}

function addContentVideo(contentSource) {
    if (document.getElementById("content-video") != undefined) {
        return false;
    }
    isContentExists = true;

    let videoContainer = document.getElementById("video-container");
    let contentVideo = document.createElement("div");
    let videoElement = document.createElement("video");

    contentVideo.classList.add("content-video");
    videoElement.id = "content-video";

    if (contentSource == null || contentSource == undefined) {
        videoElement.src = "videos/sample_640x360.webm"
    } else {
        videoElement.srcObject = videoSource;
    }
    contentVideo.appendChild(videoElement);
    videoContainer.appendChild(contentVideo);
}

function enforceGridLayout(numberOfDisplayedPeers) {
    /*document.querySelectorAll('.video-box').forEach(elem => {
        if (!elem.classList.contains('content-container')) {
            elem.classList.remove('hidden');
        }
    });*/

    let videoContainer = document.getElementById("video-container");

    if (isContentExists) {
        videoContainer.classList = "video-container video-container-content";
        return false;
    }

    if (numberOfDisplayedPeers == 1) {
        videoContainer.classList = "video-container video-container-1-row video-container-1-col";
    } else if (numberOfDisplayedPeers == 2) {
        videoContainer.classList = "video-container video-container-1-row video-container-2-col";
    } else if (numberOfDisplayedPeers > 2 && numberOfDisplayedPeers <= 4) {
        videoContainer.classList = "video-container video-container-2-row video-container-2-col";
    } else if (numberOfDisplayedPeers > 4 && numberOfDisplayedPeers <= 6) {
        videoContainer.classList = "video-container video-container-2-row video-container-3-col";
    } else if (numberOfDisplayedPeers > 6 && numberOfDisplayedPeers <= 9) {
        videoContainer.classList = "video-container video-container-3-row video-container-3-col";
    } else if (numberOfDisplayedPeers > 9 && numberOfDisplayedPeers <= 12) {
        videoContainer.classList = "video-container video-container-3-row video-container-4-col";
    } else if (numberOfDisplayedPeers > 12 && numberOfDisplayedPeers <= 16) {
        videoContainer.classList = "video-container video-container-4-row video-container-4-col";
    } else {
        videoContainer.classList = "video-container video-container-1-row video-container-1-col";
    }
}

function enforceLayout_(numberOfDisplayedPeers) {
    if (!isContentExists) {
        enforceGridLayout(numberOfDisplayedPeers);
    } else {
        if (false) {

            isContentShown = true;
            let videoContainer = document.getElementById("video-container");

            videoContainer.classList = "video-container video-container-1-row video-container-1-col";
        } else {
            videoContainer.classList = "video-container video-container-4-row video-container-4-col";
        }
    }
}
/*
            isContentShown = true;
            document.getElementById('videos').setAttribute('class', '');
            document.getElementById('videos').classList.add('single_cell');
            document.getElementsByClassName('content-container')[0].classList.remove('hidden');
            document.querySelectorAll('.video-box').forEach(elem => {
                if (!elem.classList.contains('content-container')) {
                    elem.classList.add('hidden');
                }
            });
            
            let swipeDone = false;
            let lastY = 120;
            let lastX = 120;
            let currentX = 120;
            var currentY = 120;

            var touchInitiation = (e) => {
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            }

            var detectSwipe = (e) => {
                currentY = e.touches[0].clientY;
                currentX = e.touches[0].clientX;
                swipeDone = true;
            }

            document.removeEventListener('touchend', swipeEventFunction);
            swipeEventFunction = function () {
                if (swipeDone && Math.abs(lastX - currentX) > 50 && Math.abs(lastY - currentY) < 50) {
                    swipeDone = false;
                    swipeContent();
                }
                console.log('currentY ' + currentY + 'Last Y ' + lastY);
                console.log('currentX ' + currentX + 'Last X ' + lastX);
            }

            document.addEventListener('touchstart', (e) => touchInitiation(e), false);
            document.addEventListener('touchmove', (e) => detectSwipe(e), false);
            document.addEventListener('touchend', swipeEventFunction, false);
        } else {
            document.getElementById('videos').setAttribute('class', '');
            document.getElementById('videos').classList.add('sixteen_cell');
            document.getElementById('local-video-container').classList.remove('side-local-video');
        }
    }
*/

function mouseMoveListener() {
    document.getElementById("button-container").style.display = "block";
    setTimeout(event => {
        console.log("Buton bar Hidding");
        document.getElementById("button-container").style.display = "none";
    },5000);
}