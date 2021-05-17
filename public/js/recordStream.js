var recordedChunks = [];


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

function startRecordForLocal() {
    let options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(cameraStream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    return mediaRecorder;
}

function testLocalRecord(sec=3) {
    mediaRecorder = startRecordForLocal();
    setTimeout(event => {
        console.log("stopping");
        stopRecordForLocal(mediaRecorder);
    }, sec*1000);
}