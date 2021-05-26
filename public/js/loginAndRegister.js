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

let params;
var db;
var auth;
let roomPage = "room.html"

function register() {
   let name = document.querySelector('#registerName').value;
   let email = document.querySelector('#registerEmail').value;
   let password = document.querySelector('#registerPass').value;
   console.log("name:",name,"email:",email,"password:",password);

   auth.createUserWithEmailAndPassword(email,password)
      .then(function (userCredential) {
         console.log(userCredential);
         let userId = userCredential.user.uid;
         console.log("userID:",userId);

         const userRef = db.collection('users').doc(`${userId}`);
         userRef.set({
            'name': userId,
            'username':name, 
            'email':email, 
            'password':password 
         });

         login(email,password);
      })
      .catch(function (error) {
         // Handle Errors here.
         let errorCode = error.code;
         let errorMessage = error.message;
         if (errorCode === 'auth/wrong-password') {
            console.log("wrongPassword");
            //alert('Wrong password.');
         } else {
            console.log("error:",errorMessage);
            //alert(errorMessage);
         }
         console.log(error);
      });
}

function login() {
   let email = document.querySelector('#loginEmail').value;
   let password = document.querySelector('#loginPass').value;
   console.log("email:",email,"password:",password);
   auth.signInWithEmailAndPassword(email, password)
      .then(function (userCredential) {
         console.log(userCredential);
         let userId = userCredential.user.uid;
         console.log("userID:",userId);

         //Login tamamlandı, o zaman görüntülü görüşme sayfasına yönlendirelim
         if (params.get('roomId')) {
            let roomID = params.get('roomId');
            window.location.href = "/"+roomPage+"?roomId="+roomID;
         } else{
            window.location.href = "/"+roomPage;
         }

      })
      .catch(function (error) {
         // Handle Errors here.
         var errorCode = error.code;
         var errorMessage = error.message;
         if (errorCode === 'auth/wrong-password') {
            console.log("wrongPassword");
            //alert('Wrong password.');
         } else {
            console.log("error:",errorMessage);
            //alert(errorMessage);
         }
         console.log(error);
      });
}

function logout() {
   auth.signOut()
   .then(function () {  
      console.log("signOut Completed");
      //Oturum Kapatma bittiğinde
   })
   .catch(function (error) {  
      console.error("oturum kapatma hatası:",error);
   })
}

function init() {
   firebase.initializeApp(firebaseConfig);

   db = firebase.firestore();
   auth = firebase.auth();
   
   if (location.hostname === "localhost") {
      //db.useEmulator("localhost", "8080");
      //auth.useEmulator("localhost", "9099");
      auth.useEmulator("http://localhost:9099");
   }

   params = new URLSearchParams(location.search);

   document.querySelector('#registerBtn').addEventListener('click', register);
   document.querySelector('#loginBtn').addEventListener('click', login);
}

init();

$('p[class ="message"]').not('a[id="changePass"]').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});