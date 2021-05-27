let numberOfDisplayedPeers = 0;

let chatBarIsOpen = false;
let usersBarIsOpen = false;

function enforceLayout(numberOfDisplayedPeers) {
    if (!isContentExists) {
        gridLayout(numberOfDisplayedPeers);
    } else {
        if (false) {
            isContentShown = true;
            document.getElementById('videos').setAttribute('class', '');
            document.getElementById('videos').classList.add('single_cell');
            document.getElementsByClassName('contentContainer')[0].classList.remove('hidden');
            document.querySelectorAll('.video-box').forEach(elem => {
                if (!elem.classList.contains('contentContainer')) {
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
            document.getElementById('localVideoContainer').classList.remove('sideLocalVideo');
        }
    }
}

function gridLayout(numberOfDisplayedPeers) {
    document.querySelectorAll('.video-box').forEach(elem => {
        if (!elem.classList.contains('contentContainer')) {
            elem.classList.remove('hidden');
        }
    });

    if (numberOfDisplayedPeers == 1) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementById('localVideoContainer').classList.add('sideLocalVideo');
    } else if (numberOfDisplayedPeers == 2) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('two_cell');
        document.getElementById('localVideoContainer').classList.add('sideLocalVideo');
    } else if (numberOfDisplayedPeers > 2 && numberOfDisplayedPeers <= 4) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('four_cell');
        document.getElementById('localVideoContainer').classList.add('sideLocalVideo');
    } else if (numberOfDisplayedPeers > 4 && numberOfDisplayedPeers <= 9) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('nine_cell');
        document.getElementById('localVideoContainer').classList.add('sideLocalVideo');
    } else if (numberOfDisplayedPeers > 9) {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('sixteen_cell');
        document.getElementById('localVideoContainer').classList.add('sideLocalVideo');
    } else {
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementById('localVideoContainer').classList.remove('sideLocalVideo');
    }
}

function swipeContent() {
    if (isContentShown) {
        isContentShown = false;
        document.getElementsByClassName('contentContainer')[0].classList.add('hidden');
        gridLayout(numberOfDisplayedPeers - 1);
    } else {
        isContentShown = true;
        document.getElementById('videos').setAttribute('class', '');
        document.getElementById('videos').classList.add('single_cell');
        document.getElementsByClassName('contentContainer')[0].classList.remove('hidden');
        document.querySelectorAll('.video-box').forEach(elem => {
            if (!elem.classList.contains('contentContainer')) {
                elem.classList.add('hidden');
            }
        });
    }
}

function createPeerVideo(peerId, isPeerContent) {
    const peerNode = document.getElementsByClassName('video-box')[0].cloneNode();
    peerNode.appendChild(document.getElementById('localVideo').cloneNode());

    peerNode.id = 'video' + peerId + 'Container';
    peerNode.firstElementChild.id = 'video' + peerId;

    peerNode.classList.remove('sideLocalVideo');
    peerNode.classList.remove('relaxedHidden');
    if (isPeerContent) {
        let inFullscreen = false;
        isContentShown = true;
        isContentExists = true;
        peerNode.classList.add('contentContainer');
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
        localVideoElem = document.getElementById('localVideoContainer');
        localVideoElem.classList.add('relaxedHidden');
        document.getElementById('localVideoShowButton').classList.remove('hidden'); 
    }
}

function showLocalVideo() {
    localVideoElem = document.getElementById('localVideoContainer');
    localVideoElem.classList.remove('relaxedHidden');
    document.getElementById('localVideoShowButton').classList.add('hidden'); 
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

function mouseMoveListener() {
        document.getElementById("button-container").style.display = "block";
        setTimeout(event => {
            console.log("Buton bar Hidding");
            document.getElementById("button-container").style.display = "none";
        },5000);
}

function chatBtnListener() {
    if (chatBarIsOpen) {
        document.getElementById("chat-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "none";
        chatBarIsOpen = false;
    }else{
        if (usersBarIsOpen) {
            document.getElementById("users-bar").style.display = "none";
            usersBarIsOpen = false;
        }
        document.getElementById("chat-bar").style.display = "block";
        document.getElementById("bars-container").style.display = "block";
        chatBarIsOpen = true;
    }
}

function usersBtnListener() {
    if (usersBarIsOpen) {
        document.getElementById("users-bar").style.display = "none";
        document.getElementById("bars-container").style.display = "none";
        usersBarIsOpen = false;
    }else{
        if (chatBarIsOpen) {
            document.getElementById("chat-bar").style.display = "none";
            chatBarIsOpen = false;
        }
        document.getElementById("users-bar").style.display = "block";
        document.getElementById("bars-container").style.display = "block";
        usersBarIsOpen = true;
    }
}

function setAllListeners() {
    document.getElementById("chat-btn").onclick = chatBtnListener;
    document.getElementById("users-btn").onclick = usersBtnListener;
    //document.getElementById("main-container").onmousemove = mouseMoveListener; 
}

setAllListeners();


//!-----------------------------------------------------------------------------------------------------------------
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
        if (!elem.classList.contains('contentContainer')) {
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
            document.getElementsByClassName('contentContainer')[0].classList.remove('hidden');
            document.querySelectorAll('.video-box').forEach(elem => {
                if (!elem.classList.contains('contentContainer')) {
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
            document.getElementById('localVideoContainer').classList.remove('sideLocalVideo');
        }
    }





    */