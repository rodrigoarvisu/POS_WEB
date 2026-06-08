let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
let total = 0;
let productosGlobal = [];
let productosFiltrados = [];
let paginaActual = 1;
let procesandoEnter = false;

const productosPorPagina = 3;
const inputBusqueda = document.getElementById('buscador-productos');


function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}


function limpiarCarrito() {
    carrito = [];
    renderCarrito();
    localStorage.removeItem('carrito');
}


function agregarCarrito(id, nombre, precio_venta, stock) {

    if (stock <= 0) {
        Swal.fire({ icon: 'error', title: 'Sin stock', text: 'Este producto no tiene existencias' });
        return;
    }

    const precio = parseFloat(precio_venta);
    const productoExistente = carrito.find(p => p.nombre === nombre);

    if (productoExistente) {
        productoExistente.cantidad++;
        productoExistente.total = productoExistente.cantidad * productoExistente.precio;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1, total: precio });
    }

   
    renderCarrito();
    guardarCarrito();
}


function renderCarrito() {
    const tbody = document.getElementById('tbody-carrito');
    const tablaVacia = document.getElementById('tabla-vacia');
    tbody.innerHTML = '';
    total = 0;

     if (carrito.length === 0) {
        tablaVacia.style.display = 'flex'; 
    } else {
        tablaVacia.style.display = 'none'; 
    }

    carrito.forEach(producto => {
        total += producto.total;

        const tr = document.createElement('tr');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = producto.nombre;

        const tdCantidad = document.createElement('td');
        tdCantidad.innerHTML = `
            <div class="controles-cantidad">
            <button class="btn-cantidad" onclick="disminuirCantidad('${producto.nombre}')">-</button>
            ${producto.cantidad}
            <button class="btn-cantidad" onclick="aumentarCantidad('${producto.nombre}')">+</button>
            </div> 
        `;

        const tdTotal = document.createElement('td');
        tdTotal.textContent = '$' + producto.total.toFixed(2);

        const tdAccion = document.createElement('td');
        tdAccion.innerHTML = `<button class="btn-quitar" onclick="eliminarDelCarrito('${producto.nombre}')">❌</button>`;

        tr.append(tdNombre, tdCantidad, tdTotal, tdAccion);
        tbody.appendChild(tr);
    });
    

    document.getElementById('total-venta').innerText = '$' + total.toFixed(2);
}


function renderProductos(productos) {
    const tbody = document.getElementById('tbody-ventas');
    tbody.innerHTML = '';

    const inicio = (paginaActual - 1) * productosPorPagina;
    const productosPagina = productos.slice(inicio, inicio + productosPorPagina);

    productosPagina.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>$${parseFloat(producto.precio_venta).toFixed(2)}</td>
            <td><button class="btn-agregar">Agregar</button></td>
        `;

        tr.querySelector('.btn-agregar').addEventListener('click', () => {
            agregarCarrito(producto.id, producto.nombre, producto.precio_venta, producto.stock);
        });

        tbody.appendChild(tr);
    });

    renderBotones(productos);
}


function renderBotones(productos) {
    const contenedor = document.getElementById('paginacion');
    contenedor.innerHTML = '';

    const totalPaginas = Math.ceil(productos.length / productosPorPagina);

    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, paginaActual + 2);

    if (fin - inicio < 4) {
        inicio = Math.max(1, fin - 4);
        fin = Math.min(totalPaginas, inicio + 4);
    }

    if (paginaActual > 1) {
        contenedor.innerHTML += `<button class="btn-pagina" onclick="cambiarPagina(${paginaActual - 1})">←</button>`;
    }

    for (let i = inicio; i <= fin; i++) {
        contenedor.innerHTML += `<button class="btn-pagina ${i === paginaActual ? 'activa' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
    }

    if (paginaActual < totalPaginas) {
        contenedor.innerHTML += `<button class="btn-pagina" onclick="cambiarPagina(${paginaActual + 1})">→</button>`;
    }
}


function cambiarPagina(pagina) {
    paginaActual = pagina;
    renderProductos(productosFiltrados);
}


function eliminarDelCarrito(nombre) {
    carrito = carrito.filter(p => p.nombre !== nombre);
    renderCarrito();
    guardarCarrito();
}


function aumentarCantidad(nombre) {
    const producto = carrito.find(p => p.nombre === nombre);
    if (!producto) return;
    producto.cantidad++;
    producto.total = producto.cantidad * producto.precio;
    renderCarrito();
    guardarCarrito();
}


function disminuirCantidad(nombre) {
    const producto = carrito.find(p => p.nombre === nombre);
    if (!producto) return;
    producto.cantidad--;
    if (producto.cantidad <= 0) {
        carrito = carrito.filter(p => p.nombre !== nombre);
    } else {
        producto.total = producto.cantidad * producto.precio;
    }
    renderCarrito();
    guardarCarrito();
}


fetch('/obtener-productos')
    .then(r => r.json())
    .then(productos => {
        productosGlobal = productos;
        productosFiltrados = productos;
        renderProductos(productosFiltrados);
    });


inputBusqueda.addEventListener('input', function () {
    if (procesandoEnter) return;

    const texto = inputBusqueda.value.trim().toLowerCase();

    productosFiltrados = productosGlobal.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.codigo.toString().toLowerCase().includes(texto)
    );

    paginaActual = 1;
    renderProductos(productosFiltrados);
});


inputBusqueda.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    procesandoEnter = true;

    const codigo = inputBusqueda.value.trim();
    const producto = productosGlobal.find(p => p.codigo.toString().trim() === codigo);

    if (!producto) {
        Swal.fire({ icon: 'error', title: 'Producto no encontrado', text: 'No existe un producto con ese código' });
        inputBusqueda.value = '';
        renderProductos(productosGlobal);
        procesandoEnter = false;
        return;
    }

    if (producto.stock <= 0) {
        Swal.fire({ icon: 'warning', title: 'Sin stock', text: 'El producto no tiene existencias' });
        inputBusqueda.value = '';
        renderProductos(productosGlobal);
        procesandoEnter = false;
        return;
    }

    agregarCarrito(producto.id, producto.nombre, producto.precio_venta, producto.stock);
    inputBusqueda.value = '';
    productosFiltrados = productosGlobal;
    renderProductos(productosGlobal);
    procesandoEnter = false;
});


document.getElementById('btn-cobrar').addEventListener('click', () => {

    if (carrito.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos antes de cobrar', confirmButtonColor: '#1565c0' });
        return;
    }

    fetch('/guardar-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito, total })
    })
    .then(r => r.text())
    .then(data => {
        Swal.fire({ icon: 'success', title: 'Venta realizada', text: data, confirmButtonColor: '#16a34a' })
        .then(() => {
            limpiarCarrito();
            location.reload();
        });
    });
});

document.getElementById('btn-limpiar')
.addEventListener('click', () => {
    if(carrito.length === 0){
        return;
    }
    limpiarCarrito();
})


renderCarrito();
inputBusqueda.focus();

function cargarHistorial() {
    fetch('/historial-ventas')
        .then(r => r.json())
        .then(ventas => {
            const tbody = document.getElementById('tbody-historial');
            tbody.innerHTML = '';

            if (ventas.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">
                            No hay ventas registradas
                        </td>
                    </tr>`;
                return;
            }

            ventas.forEach(venta => {
                const fecha = new Date(venta.fecha);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${venta.id}</td>
                    <td>${fecha.toLocaleDateString('es-MX')}</td>
                    <td>${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>$${parseFloat(venta.total).toFixed(2)}</td>
                    <td><button class="btn-ver" onclick="verDetalleVenta(${venta.id})">👁️</button></td>
                `;
                tbody.appendChild(tr);
            });
        });
}


function verDetalleVenta(id) {
    fetch(`/detalle-venta/${id}`)
        .then(r => r.json())
        .then(data => {
            const detalle = document.getElementById('detalle-venta');
            detalle.style.display = 'block';

            const fecha = new Date(data.venta.fecha);
            document.getElementById('detalle-folio').innerText = `#${data.venta.id}`;

            document.getElementById('detalle-info').innerHTML = `
                <div class="detalle-dato">
                    <span>Fecha</span>
                    <strong>${fecha.toLocaleDateString('es-MX')}</strong>
                </div>
                <div class="detalle-dato">
                    <span>Hora</span>
                    <strong>${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
                <div class="detalle-dato">
                    <span>Total</span>
                    <strong>$${parseFloat(data.venta.total).toFixed(2)}</strong>
                </div>
            `;

            const tbody = document.getElementById('tbody-detalle');
            tbody.innerHTML = '';

            data.productos.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.nombre}</td>
                    <td>$${parseFloat(p.precio).toFixed(2)}</td>
                    <td>${p.cantidad}</td>
                    <td>$${parseFloat(p.subtotal).toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('detalle-total').innerHTML = `
                <p>Total de productos: ${data.productos.reduce((a, p) => a + p.cantidad, 0)}</p>
                <p class="total-detalle">Total: <strong>$${parseFloat(data.venta.total).toFixed(2)}</strong></p>
            `;

            detalle.scrollIntoView({ behavior: 'smooth' });
        });
}

cargarHistorial();