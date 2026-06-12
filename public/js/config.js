
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