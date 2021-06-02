let chatRoomRef; //Odanın içindeki chat collection'ının referansını tutar

let messagesAll;

async function incomingMessageListener(roomID){
    if (chatRoomRef == null && chatRoomRef == undefined) {
        getChatRoomRef(roomID);
    }

    messagesAll = [];
    chatRoomRef.orderBy("datetime","asc").onSnapshot(async snapshot => {
        snapshot.docChanges().forEach(change => {//doküman değişikliğinde her br değişiklik için çağırılır.
            if (change.type === 'added') {
                let messageData = change.doc.data();
                console.log("Chat için Değişiklik oldu");
                console.log("Chat -> change.doc.data():",messageData);
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

async function getChatRoomRef(roomID) {
    chatRoomRef = db.collection('rooms').doc(`${roomID}`).collection('chat'); 
    console.log("ChatRoomRef",chatRoomRef);
}

async function sendMessage(message) {
    if (chatRoomRef == null && chatRoomRef == undefined) {
        console.log("ChatRoomRef is Undefined, chatRoomRef:", chatRoomRef);
    }
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

function sendMessageOnClick(event) {
    let message = document.getElementById("message-send-text").value;
    console.log("sendMessageOnClick: ",message);
    if (message != "" && message != null && message != undefined) {
        sendMessage(message);
        document.getElementById("message-send-text").value = "";
    }else{
        console.log("Boş Mesaj gönderilmez");
        createSideAlert("Boş mesaj gönderilemez", "warning",3);
    }
}

document.getElementById("message-send-btn").addEventListener("click", sendMessageOnClick);