const params = new URLSearchParams(window.location.search);

if(params.get('registro')){

    Swal.fire({
        icon: 'success',
        title: '¡Muy bien!',
        text: 'Usuario registrado con exito.'
    });
}


if(params.get('error')){

    Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'No se pudo registrar el usuario, verifica los datos.'
    });
}


if(params.get('verificar')){

    Swal.fire({
        icon: 'warning',
        title: '¡Advertencia!',
        text: 'Verifica que las contraseñas sean las mismas.'
    });

    window.history.replaceState({}, document.title, "/registro.html");
}