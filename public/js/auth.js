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
   let name = document.querySelector('#register-name').value;
   let email = document.querySelector('#register-email').value;
   let password = document.querySelector('#register-pass').value;
   
   console.log("name:",name,"email:",email,"password:",password)

   if (name == undefined || name == null || name == "") {
      createSideAlert("İsim alanı boş bırakılamaz.", "warning", 3);
      highlightElement("register-name", 5);
      return;
   } else if (email == undefined || email == null || email == "") {
      createSideAlert("Email alanı boş bırakılamaz.", "warning", 3);
      highlightElement("register-email", 5);
      return;
   } else if (password == undefined || password == null || password == "") {
      createSideAlert("Şifre alanı boş bırakılamaz.", "warning", 3);
      highlightElement("register-pass", 5);
      return;
   }


   auth.createUserWithEmailAndPassword(email,password)
      .then(function (userCredential) {
         console.log(userCredential);
         let userId = userCredential.user.uid;
         console.log("userID:",userId);

         db.collection('users').doc(`${userId}`).set({
            'name': userId,
            'username':name, 
            'email':email, 
            'password':password 
         });

         createSideAlert("Kullanıcı Oluşturuldu, Yönlendiriliyorsunuz", "success", 5);

         login(null, email,password);
      })
      .catch(function (error) {
         // Handle Errors here.
         let errorCode = error.code;
         let errorMessage = error.message;

         if (errorCode === 'auth/wrong-password' || errorCode === "auth/weak-password") {
            console.log("wrongPassword");
            createSideAlert("Şifreniz 6 karakterden uzun olmalıdır", "warning", 5);
            highlightElement("register-pass", 5)
         } else if(errorCode === "auth/invalid-email"){
            console.log("invalid email format");
            createSideAlert("Epostanızı doğru yazdığınızdan emin olun", "warning", 5);
            highlightElement("register-email", 5);
         } else if(errorCode === "auth/email-already-in-use"){
            console.log("auth/email-already-in-use");
            createSideAlert("Bu E-posta kullanımda", "warning", 5);
            highlightElement("register-email", 5);
         } else {
            console.log("error:",errorMessage);
            createSideAlert(errorMessage,"warning", 5);
         }
         
         console.log(error);
      });
}

function login(event, email, password) {
   console.log(event);
   if (email == undefined || email == null || password == undefined || password == null) {
      email = document.querySelector('#login-email').value;
      password = document.querySelector('#login-pass').value;
   }

   console.log("email:",email,"password:",password);
   
   if (email == undefined || email == null || email == "") {
      createSideAlert("Email alanı boş bırakılamaz.", "warning", 3);
      highlightElement("login-email", 5);
      return;
   } else if (password == undefined || password == null || password == "") {
      createSideAlert("Şifre alanı boş bırakılamaz.", "warning", 3);
      highlightElement("login-pass", 5);
      return;
   }

   
   auth.signInWithEmailAndPassword(email, password)
      .then(function (userCredential) {
         createSideAlert("Giriş Başarılı, Yönlendiriliyorsunuz", "success", 5);
         
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
         let errorCode = error.code;
         let errorMessage = error.message;

         if (errorCode === 'auth/wrong-password' || errorCode === "auth/weak-password") {
            console.log("wrongPassword");
            createSideAlert("Hatalı Şifre girdiniz", "warning", 5);
            highlightElement("login-pass", 5)
         } else if(errorCode === "auth/invalid-email"){
            console.log("invalid email format");
            createSideAlert("Epostanızı doğru yazdığınızdan emin olun", "warning", 5);
            highlightElement("login-email", 5);
         } else if(errorCode === "auth/email-already-in-use"){
            console.log("auth/email-already-in-use");
            createSideAlert("Bu E-posta kullanımda", "warning", 5);
            highlightElement("login-email", 5);
         } else if(errorCode === "auth/user-not-found"){
            console.log("auth/user-not-found");
            createSideAlert("Böyle bir kullanıcı bulunamadı", "warning", 5);
            highlightElement("login-email", 5);
            highlightElement("login-pass", 5);
         } else {
            console.log("error:",errorMessage);
            createSideAlert(errorMessage,"warning", 5);
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

   document.querySelector('#register-btn').addEventListener('click', register);
   document.querySelector('#login-btn').addEventListener('click', login);
}

init();

$('p[class ="message"]').not('a[id="change-pass"]').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});