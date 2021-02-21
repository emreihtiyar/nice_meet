$(document).ready(function () {
/*
    // TODO: Replace the following with your app's Firebase project configuration
    // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
    const firebaseConfig = {
        apiKey: "AIzaSyCeuHu2KoX_rSVNAeKATRSDQEmMps1bHvs",
        authDomain: "nicetomeet-33b4a.firebaseapp.com",
        databaseURL: "https://nicetomeet-33b4a-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "nicetomeet-33b4a",
        storageBucket: "nicetomeet-33b4a.appspot.com",
        messagingSenderId: "242610313695",
        appId: "1:242610313695:web:6c804cd2dff52ad5990c6a",
        measurementId: "G-F840F7K0YQ"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
*/
    $("#loginBtn").click(function (event) {
        let email = $("#email").val();
        let password = $("#password").val();

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in 
                let user = userCredential.user;
                window.location.href = "index.html";
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                alert(errorMessage);
            });
    });

});