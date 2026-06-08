const params = new URLSearchParams(window.location.search);

if(params.get('error')){

    Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Usuario o contraseña incorrectos'
    });

    window.history.replaceState({}, document.title, "/index.html");

}