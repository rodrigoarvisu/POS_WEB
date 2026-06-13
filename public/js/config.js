
function mostrarSeccion(id, boton) {
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.remove('activa');
    });

    document.getElementById(id).classList.add('activa');

    document.querySelectorAll('.config-item').forEach(item => {
        item.classList.remove('activo');
    });
    boton.classList.add('activo');
}

document.querySelector('#seguridad .btn-guardar').addEventListener('click', () => {
    const usuario = localStorage.getItem('usuario');

    const inputs = document.querySelectorAll('#seguridad input');
    const contrasenaActual = inputs[0].value;
    const nuevaContrasena = inputs[1].value;
    const confirmacion = inputs[2].value;

    if (!contrasenaActual || !nuevaContrasena || !confirmacion) {
        Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Llena todos los campos' });
        return;
    }

    fetch('/cambiar-contrasena', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasenaActual, nuevaContrasena, confirmacion })
   })
   .then(r => r.json().then(data => ({ status: r.status, data })))
   .then(({ status, data }) => {
    Swal.fire({
        icon: status === 200 ? 'success' : 'error',
        title: data.mensaje
    });

    if (status === 200) {
        inputs.forEach(input => input.value = '');
    }
})
.catch(error => {
    Swal.fire({
        icon: 'error',
        title: 'Error de conexión'
    });
});
});