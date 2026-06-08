let productosGlobal = [];
let idEditando = null;


function renderProductos(productos) {
    const tbody = document.getElementById('tbody-productos');
    tbody.innerHTML = '';

    productos.forEach(producto => {
        tbody.innerHTML += `
        <tr>
            <td>${producto.id}</td>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio_venta}</td>
            <td>$${producto.precio_compra}</td>
            <td>${producto.stock}</td>
            <td>
                <button class="btn-editar" onclick="editarProducto(
                    ${producto.id},
                    '${producto.codigo}',
                    '${producto.nombre}',
                    ${producto.precio_venta},
                    ${producto.precio_compra},
                    ${producto.stock}
                )">Editar</button>

                <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
            </td>
        </tr>
        `;
    });
}


fetch('/obtener-productos')
    .then(response => response.json())
    .then(productos => {
        productosGlobal = productos;
        renderProductos(productos);
    });


document.getElementById('buscador-productos').addEventListener('input', function () {
    const texto = this.value.toLowerCase();
    const filtrados = productosGlobal.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.codigo.toString().toLowerCase().includes(texto)
    );
    renderProductos(filtrados);
});


const form = document.getElementById('form-producto');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const codigo = document.getElementById('codigo').value;
    const nombre = document.getElementById('nombre').value;
    const precio_venta = document.getElementById('precio_venta').value;
    const precio_compra = document.getElementById('precio_compra').value;
    const stock = document.getElementById('stock').value;

    if (idEditando) {
        fetch('/actualizar-producto/' + idEditando, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, precio_venta, precio_compra, stock })
        })
        .then(response => response.text())
        .then(data => {
            Swal.fire({ icon: 'success', title: 'Producto actualizado', text: data })
            .then(() => location.reload());
        });
    } else {
        fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, precio_venta, precio_compra, stock })
        })
        .then(response => response.text())
        .then(data => {
            Swal.fire({ icon: 'success', title: 'Producto guardado', text: 'El producto se registró correctamente' })
            .then(() => location.reload());
        });
    }
});


function editarProducto(id, codigo, nombre, precio_venta, precio_compra, stock) {
    idEditando = id;
    document.getElementById('codigo').value = codigo;
    document.getElementById('nombre').value = nombre;
    document.getElementById('precio_venta').value = precio_venta;
    document.getElementById('precio_compra').value = precio_compra;
    document.getElementById('stock').value = stock;
    document.getElementById('btn-guardar').innerText = 'Actualizar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('codigo').focus();
}


function eliminarProducto(id) {
    Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Esta acción no podrá deshacerse',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
    })
    .then((result) => {
        if (result.isConfirmed) {
            fetch('/eliminar-producto/' + id, { method: 'DELETE' })
            .then(response => response.text())
            .then(data => {
                Swal.fire({ icon: 'success', title: 'Producto eliminado', text: data })
                .then(() => location.reload());
            });
        }
    });
}

window.onload = function () {
    document.getElementById('codigo').focus();
}