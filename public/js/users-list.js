async function getUserInfoByUID(uid) {
    let userInfo;
    console.log("getUserInfoByUID, userInfo: ", userInfo);
    if (uid != null && uid != undefined && uid !="") {
        db.collection('users').doc(uid).get().then(snap => {
            console.log(snap.data());
            userInfo = snap.data();
        });
    }
    return userInfo;
}

function userJoined(user) {
    let userInfo;
    if (uid != null && uid != undefined && uid !="") {
        db.collection('users').doc(user.name).get().then(snap => {
            console.log(snap.data());
            userInfo = snap.data();
        });
    }
}

async function partyListListener(roomRef) {
    roomRef.collection("partyList").onSnapshot(async snapshot => {
        snapshot.docChanges().forEach(change => {//doküman değişikliğinde her br değişiklik için çağırılır.
            if (change.type === 'added') {
                /* Kullanıncı katıldı*/
                let user = change.doc.data();
                console.log("partyList için Değişiklik oldu");
                console.log("partyList -> change.doc.data():",user);
                addUserBubble(user.name, user.username, user.display, user.muteState, user.videoState);
            }
            if (change.type === 'removed') {
                /* Kullanıncı Ayrıldı*/
                let user = change.doc.data();
                console.log("partyList için Değişiklik oldu");
                console.log("partyList -> change.doc.data():",user);
                deleteUserBubble(user.name);
            }
            if (change.type === 'modified') {
                /* Kullanıncı ile ilgili bilgi değişti*/
            }
        });
    })
}