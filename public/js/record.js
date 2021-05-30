let recordedChunks = [];
let isRecording = false
let currentMediaRecorder;

function recordStartOrStop() {
    if (isRecording && currentMediaRecorder != undefined) {
        stopRecord(currentMediaRecorder);
        isRecording = false;
    }
    else{
        currentMediaRecorder = recordMeeting();
        isRecording = true;
    }
}

function recordMeeting() {
    console.log("recording :)");
    
    if (isContentExists && isContentShown) { //Başkası şuanda sunum yapıyor mu?
        //TODO: Burada local yerine sunan kişinin videosu alınacak
        let contentVideo = document.querySelector(".contentContainer").children[0];
        let cameraVideo = document.getElementById("local-video");
        
        return recordStartOnCanvas([contentVideo, cameraVideo], true);

    } else {
        if (contentState) { //Ben sunum yapıyor muyum?
            let contentVideo = document.getElementById("local-screen-video");
            let cameraVideo = document.getElementById("local-video");

            return recordStartOnCanvas([contentVideo, cameraVideo], true);
        }else{ //Hiç sunum yok
            let videos = [];
            let htmlCol = document.getElementsByTagName("video");

            for (let i = 0; i < htmlCol.length; i++) {
                videos.push(htmlCol.item(i));
            }

            return recordStartOnCanvas(videos, false);
        }
    }
}

//! record Start and Stop functions and functions required for the start and end function
function handleDataAvailable(event) {
    console.log("data-available");
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log(recordedChunks);
        download();
    } else {
        // ...
    }
}

function download() {
    var blob = new Blob(recordedChunks, {
        type: "video/webm"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "nice meet meeting record "+(new Date().toDateString())+".webm";
    a.click();
    recordedChunks = [];
    window.URL.revokeObjectURL(url);
}

function stopRecord(mediaRecorder) {
    console.log("stopping");
    mediaRecorder.stop();
    clearCanvas();
}

function startRecordAtStream(stream) {
    let options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    return mediaRecorder;
}

function recordStartOnCanvas(videos, isContentExists) {
    let canvas = startCanvas(videos, isContentExists);
    let canvasStream = canvas.captureStream(30);

    videos.forEach(element => {
        if(element.srcObject.getAudioTracks()[0]){
            canvasStream.addTrack(element.srcObject.getAudioTracks()[0]);
        }
    });

    return startRecordAtStream(canvasStream);
}

//! Canvas functions -> drawing videos and clear
function startCanvas(videos, isContentExists) {
    let canvas = document.getElementById("record-canvas");
    let context = canvas.getContext("2d");
    console.log("videos:", videos);

    if (isContentExists) {
        drawVideosWithContent(context, videos[0], videos[1], context.canvas.clientWidth, context.canvas.clientHeight);
    }else{
        drawVideosNoContent(context, videos, context.canvas.clientWidth, context.canvas.clientHeight);
    }

    return canvas;
}

function clearCanvas() {
    let canvas = document.getElementById("record-canvas");
    let canvasContainer = document.getElementById("canvas-container");
    let newCanvas = canvas.cloneNode(false);

    canvasContainer.removeChild(canvas);
    canvasContainer.appendChild(newCanvas);
}

function drawVideosWithContent(context, contentVideo, cameraVideo, canvasWidth, canvasHeight, other) {
    if (other == undefined || other == null) {
        other = [(canvasWidth*(4/5)), canvasHeight, (canvasWidth*(1/5)), (canvasHeight*(1/5))]; // content_width, content_height, camera_width, camera_height
    }
    context.drawImage(contentVideo, 0, 0, other[0], other[1]);
    context.drawImage(cameraVideo, other[0]+1, (other[1]/2)-(other[3]/2), other[2], other[3]);
    //setTimeout(drawVideosWithContent, 10, context, contentVideo, cameraVideo, canvasWidth, canvasHeight, other);
    setTimeout(collectVideos, 10, context, canvasWidth, canvasHeight);
}

function drawVideosNoContent(context, videos, canvasWidth, canvasHeight) {
    let nVideos = videos.length;

    if (nVideos == 1) {
        context.drawImage(videos[0], 1, 1, canvasWidth-1, canvasHeight-1);
    }else if (nVideos == 2) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2, canvasHeight);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight);
    }else if (nVideos == 3) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2-1, canvasHeight/2-1);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[2], 0, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
    }else if (nVideos == 4) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2-1, canvasHeight/2-1);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[2], 0, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[3], canvasWidth/2+1, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
    }
    //setTimeout(drawVideosNoContent, 10, context, videos, canvasWidth, canvasHeight);
    setTimeout(collectVideos, 10, context, canvasWidth, canvasHeight);
}

function collectVideos(context, canvasWidth, canvasHeight) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isContentExists && isContentShown) { //Başkası şuanda sunum yapıyor mu?
        //TODO: Burada local yerine sunan kişinin videosu alınacak
        let contentVideo = document.querySelector(".contentContainer").children[0];
        let cameraVideo = document.getElementById("local-video");
        drawVideosWithContent(context, contentVideo, cameraVideo, canvasWidth, canvasHeight);
    } else {
        if (contentState) { //Ben sunum yapıyor muyum?
            let contentVideo = document.getElementById("local-screen-video");
            let cameraVideo = document.getElementById("local-video");

            drawVideosWithContent(context, contentVideo, cameraVideo, canvasWidth, canvasHeight);
        }else{ //Hiç sunum yok
            let videos = [];
            let htmlCol = document.getElementsByTagName("video");

            for (let i = 0; i < htmlCol.length; i++) {
                videos.push(htmlCol.item(i));
            }

            drawVideosNoContent(context, videos, canvasWidth, canvasHeight);
        }
    }
}

//! Test Func 
function testLocalRecord(stream, sec) {
    if (sec == undefined || sec == null) {
        sec = 60;
    }
    mediaRecorder = startRecordAtStream(stream);
    setTimeout(event => {
        console.log("stopping");
        stopRecord(mediaRecorder);
    }, sec*1000);
}