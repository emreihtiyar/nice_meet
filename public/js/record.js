let recordedChunks = [];
let isRecording = false


function recordMeeting() {
    console.log("recording :)");

    if (isContentExists) {
        
    } else {
        
    }
}

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

function stopRecordForLocal(mediaRecorder) {
    console.log("stopping");
    mediaRecorder.stop();
    clearCanvas();
}

function startRecordForLocal(stream) {
    let options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    return mediaRecorder;
}

function testLocalRecord(stream, sec) {
    if (sec == undefined || sec == null) {
        sec = 60;
    }
    mediaRecorder = startRecordForLocal(stream);
    setTimeout(event => {
        console.log("stopping");
        stopRecordForLocal(mediaRecorder);
    }, sec*1000);
}


function recordCanvas(videoIDs, isContentExists) {
    let canvas = startCanvas(videoIDs, isContentExists);
    let canvasStream = canvas.captureStream(30);

    videoIDs.forEach(element => {
        canvasStream.addTrack(document.getElementById(element).srcObject.getAudioTracks()[0]);
    });

    testLocalRecord(canvasStream, 10);
}


function startCanvas(videoIDs, isContentExists) {
/*
    let screenVideo = document.createElement("VIDEO");
    screenVideo.srcObject = new MediaStream();
    let cameraVideo = document.createElement("VIDEO");
    cameraVideo.srcObject = new MediaStream();
    document.body.appendChild(cameraVideo);
    document.body.appendChild(screenVideo);
*/
    let canvas = document.getElementById("record-canvas");
    let context = canvas.getContext("2d");
    let videos = [];

    videoIDs.forEach(element => {
        videos.push(document.getElementById(element));
    });
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
    setTimeout(drawVideosWithContent, 10, context, contentVideo, cameraVideo, canvasWidth, canvasHeight, other);
}

function drawVideosNoContent(context, videos, canvasWidth, canvasHeight) {
    let nVideos = videos.length;

    if (nVideos == 1) {
        context.drawImage(videos[0], 1, 1, canvasWidth-1, canvasHeight-1);
        setTimeout(drawVideosNoContent, 10, context, videos, canvasWidth, canvasHeight);
    }else if (nVideos == 2) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2, canvasHeight);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight);
        setTimeout(drawVideosNoContent, 10, context, videos, canvasWidth, canvasHeight);
    }else if (nVideos == 3) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2-1, canvasHeight/2-1);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[2], 0, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
        setTimeout(drawVideosNoContent, 10, context, videos, canvasWidth, canvasHeight);
    }else if (nVideos == 4) {
        context.drawImage(videos[0], 0, 0, canvasWidth/2-1, canvasHeight/2-1);
        context.drawImage(videos[1], canvasWidth/2+1, 0, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[2], 0, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
        context.drawImage(videos[3], canvasWidth/2+1, canvasHeight/2+1, canvasWidth/2, canvasHeight/2-1);
        setTimeout(drawVideosNoContent, 10, context, videos, canvasWidth, canvasHeight);
    }
}