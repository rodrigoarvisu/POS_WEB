const params = new URLSearchParams(window.location.search);

document.getElementById('txtusu').focus();

if(params.get('error')){

    Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Usuario o contraseña incorrectos'
    }).then(() =>{
        document.getElementById('txtusu').focus();
    });
    
    window.history.replaceState({}, document.title, "/pages/index.html");
}