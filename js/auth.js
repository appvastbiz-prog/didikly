function showLogin(){
document.getElementById("loginSection").style.display="block";
document.getElementById("registerSection").style.display="none";
}

function showRegister(){
document.getElementById("loginSection").style.display="none";
document.getElementById("registerSection").style.display="block";
}

async function register(){

let email=document.getElementById("regEmail").value;

if(!email.endsWith("@utem.edu.my")){
alert("Only UTeM emails allowed");
return;
}

let password=document.getElementById("regPassword").value;

const { data,error } = await supabase.auth.signUp({
email:email,
password:password
});

if(error){
alert(error.message);
}else{
alert("Check your email for OTP confirmation");
}

}

async function login(){

let email=document.getElementById("loginEmail").value;
let password=document.getElementById("loginPassword").value;

const { data,error } = await supabase.auth.signInWithPassword({
email:email,
password:password
});

if(error){
alert(error.message);
}else{
window.location="dashboard.html";
}

}
