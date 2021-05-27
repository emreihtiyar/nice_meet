var recordedChunks = [];
let isRecording = false


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
    a.download = "test.webm";
    a.click();
    window.URL.revokeObjectURL(url);
}

function stopRecordForLocal(mediaRecorder) {
    console.log("stopping");
    mediaRecorder.stop();
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


function recordCanvas(videoID1, videoID2, stream1, stream2) {
    let canvas = showCanvas(videoID1, videoID2);
    let canvasStream = canvas.captureStream(30);
    canvasStream.addTrack(stream1.getAudioTracks()[0]);
    canvasStream.addTrack(stream2.getAudioTracks()[0]);
    testLocalRecord(canvasStream, 10);
}


function showCanvas(videoID1, videoID2) {
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
    let vendorUrl = window.URL || window.webkitURL;
    console.log(context.canvas.clientWidth);

    let video1 = document.getElementById(videoID1);
    let video2 = document.getElementById(videoID2);
    console.log("video1:", video1);
    console.log("video2:", video2);

    drawVideos(context, video1, video2, context.canvas.clientWidth, context.canvas.clientHeight);
    return canvas;
}


function drawVideos(context, contentVideo, cameraVideo, canvasWidth, canvasHeight, other) {
    if (other == undefined || other == null) {
        other = [(canvasWidth*(4/5)), canvasHeight, (canvasWidth*(1/5)), (canvasHeight*(1/5))]; // content_width, content_height, camera_width, camera_height
    }
    context.drawImage(contentVideo, 0, 0, other[0], other[1]);
    context.drawImage(cameraVideo, other[0]+1, (other[1]/2)-(other[3]/2), other[2], other[3]);
    setTimeout(drawVideos, 10, context, contentVideo, cameraVideo, canvasWidth, canvasHeight, other);
}