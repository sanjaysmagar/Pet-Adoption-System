function fn(){
    var valid=true;

    var name=document.getElementById('valid01').value;
    var name1=document.getElementById('valid07').value;
    var mobile=document.getElementById('valid02').value;
    var email=document.getElementById('valid03').value;
    var password=document.getElementById('valid04').value;
    var cpassword=document.getElementById('valid05').value;

    if(name==''){
        valid=false;
        var com=document.getElementById('name')
        com.innerHTML="* please enter your firstname"
    }
    else if(name1==''){
        valid=false;
        var com=document.getElementById('name')
        com.innerHTML="* please enter your lastname"
    }
    else if(name.length<2){
        valid=false;
        var com=document.getElementById('name')
        com.innerHTML="* Name must contain atleast 3 character"
    }
    else{
        document.getElementById('name').innerHTML='';
    }

    if(mobile==''){
        valid=false;
        var com=document.getElementById('number')
        com.innerHTML="* please enter mobile number"
    }
    else if(mobile.length<10 || mobile.length>10){
        valid=false;
        var com=document.getElementById('number')
        com.innerHTML="* Please enter 10 digit number"
    }
    else{
        document.getElementById('number').innerHTML='';
    }

    if(email==''){
        valid=false;
        var com=document.getElementById('mail')
        com.innerHTML="* please enter your valid e-mail"
    }
    else{
        document.getElementById('mail').innerHTML='';
    }

    if(password==''){
        valid=false;
        var com=document.getElementById('pass1')
        com.innerHTML="* Please enter your password"
    }
    else if(password.length<8){
        valid=false;
        var com=document.getElementById('pass1')
        com.innerHTML="* Password should be 8 character long"
    }
    else{
        document.getElementById('pass1').innerHTML='';
    }

    if(cpassword==''){
        valid=false;
        var com=document.getElementById('pass2')
        com.innerHTML="* Please enter your password"
    }
    else{
        document.getElementById('pass2').innerHTML='';
    }

    if(cpassword!='' && password!=''){

        if(password!=cpassword){
            valid=false;
            var com=document.getElementById('pass2')
            com.innerHTML="* Password does not match"
        }

        if(password==cpassword){
            document.getElementById('pass2'),innerHTML='';
        }
    }
    if(!document.getElementById('valid06').checked){
        valid=false;
        var com=document.getElementById('check')
        com.innerHTML="*Please check the terms and conditions"
    }
    else{
        document.getElementById('check').innerHTML='';
    }

    return valid;
}