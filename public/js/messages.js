let chatRoomRef; //Odanın içindeki chat collection'ının referansını tutar

let messagesAll;

async function incomingMessageListener(){
    messagesAll = [];
    chatRoomRef.orderBy("datetime","asc").onSnapshot(async snapshot => {
        snapshot.docChanges().forEach(change => {//doküman değişikliğinde her br değişiklik için çağırılır.
            if (change.type === 'added') {
                let messageData = change.doc.data();
                console.log("Değişiklik oldu");
                console.log("change.doc.data():",messageData);
                messagesAll.push(change.doc);
                addMessageBubble(messageData.sender, messageData.message, messageData.datetime.toDate());
            }
        });
    });
}

async function createChatRoom(roomID) {
    chatRoomRef = db.collection('rooms').doc(`${roomID}`).collection('chat'); 
    console.log("roomID",roomID);
    console.log("ChatRoomRef",chatRoomRef);
}

async function sendMessage(message) {

    chatRoomRef.add({
        "sender":currentUserInfo.username,
        "message":message,
        "datetime":new Date()
    })
    .then(() => {
        console.log("Send Message");
    })
    .catch((sendingError) => {
        console.log("ERROR not message Sending:",sendingError);
    });
}

function init() {

    if (location.hostname === "localhost") {
        db.useEmulator("http://localhost:9099");
    }
}

init();