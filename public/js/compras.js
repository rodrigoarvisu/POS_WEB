let productos = [];
let carritoCompras = [];

const hoy = new Date().toLocaleDateString('en-CA');
document.getElementById('fecha-compra').value = hoy;

fetch('/obtener-productos')
    .then(r => r.json())
    .then(data => { productos = data; });

cargarResumen();
cargarHistorial();

function cargarResumen() {
    fetch('/resumen-compras')
        .then(r => r.json())
        .then(data => {
            document.getElementById('total-hoy').innerText = '$' + Number(data.hoy.total).toFixed(2);
            document.getElementById('compras-hoy').innerText = data.hoy.cantidad + ' compras';
            document.getElementById('total-semana').innerText = '$' + Number(data.semana.total).toFixed(2);
            document.getElementById('compras-semana').innerText = data.semana.cantidad + ' compras';
            document.getElementById('total-mes').innerText = '$' + Number(data.mes.total).toFixed(2);
            document.getElementById('compras-mes').innerText = data.mes.cantidad + ' compras';
            document.getElementById('total-año').innerText = '$' + Number(data.año.total).toFixed(2);
            document.getElementById('compras-año').innerText = data.año.cantidad + ' compras';
        });
}


document.getElementById('buscarProductos').addEventListener('input', function () {
    const texto = this.value.trim().toLowerCase();
    const resultados = document.getElementById('resultados');
    resultados.innerHTML = '';

    if (texto === '') {
        resultados.style.display = 'none';
        return;
    }

    const encontrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        String(p.codigo).includes(texto)
    );

    if (encontrados.length === 0) {
        resultados.innerHTML = '<div class="resultado-vacio">Sin resultados</div>';
        resultados.style.display = 'block';
        return;
    }

    encontrados.forEach(producto => {
        const div = document.createElement('div');
        div.className = 'resultado-item';
        div.innerHTML = `
            <div>
                <p class="resultado-nombre">${producto.nombre}</p>
                <p class="resultado-codigo">Código: ${producto.codigo}</p>
            </div>
            <p class="resultado-precio">$${parseFloat(producto.precio_compra).toFixed(2)}</p>
        `;
        div.addEventListener('click', () => {
            agregarCompra(producto.id);
            resultados.style.display = 'none';
            document.getElementById('buscarProductos').value = '';
        });
        resultados.appendChild(div);
    });

    resultados.style.display = 'block';
});



document.addEventListener('click', function (e) {
    const resultados = document.getElementById('resultados');
    if (!e.target.closest('.buscador-wrapper')) {
        resultados.style.display = 'none';
    }
});



function agregarCompra(id) {
    const producto = productos.find(p => p.id === id);
    const existente = carritoCompras.find(p => p.id === id);

    if (existente) {
        existente.cantidad++;
    } else {
        carritoCompras.push({
            id: producto.id,
            nombre: producto.nombre,
            precio_compra: parseFloat(producto.precio_compra),
            cantidad: 1
        });
    }
    renderCompras();
}



function renderCompras() {
    const tabla = document.getElementById('tablaCompras');
    const tablaVacia = document.getElementById('tabla-vacia');
    tabla.innerHTML = '';

    let total = 0;
    let totalProductos = 0;

    if (carritoCompras.length === 0) {
        tablaVacia.style.display = 'flex';
    } else {
        tablaVacia.style.display = 'none';
    }

    carritoCompras.forEach((producto, index) => {
        const subtotal = parseFloat(producto.precio_compra) * producto.cantidad;
        total += subtotal;
        totalProductos += producto.cantidad;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <p class="prod-nombre">${producto.nombre}</p>
            </td>
            <td>$${producto.precio_compra.toFixed(2)}</td>
            <td>
                <div class="controles-cantidad">
                    <button class="btn-ctrl" onclick="cambiarCantidad(${producto.id}, -1)">−</button>
                    <span>${producto.cantidad}</span>
                    <button class="btn-ctrl" onclick="cambiarCantidad(${producto.id}, 1)">+</button>
                </div>
            </td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>
                <button class="btn-eliminar-prod" onclick="eliminarProducto(${producto.id})">❌</button>
            </td>
        `;
        tabla.appendChild(tr);
    });

    document.getElementById('totalCompra').innerText = '$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 });
    document.getElementById('total-productos').innerText = totalProductos;
}



function cambiarCantidad(id, delta) {
    const producto = carritoCompras.find(p => p.id === id);
    if (!producto) return;
    producto.cantidad += delta;
    if (producto.cantidad <= 0) {
        carritoCompras = carritoCompras.filter(p => p.id !== id);
    }
    renderCompras();
}



function eliminarProducto(id) {
    carritoCompras = carritoCompras.filter(p => p.id !== id);
    renderCompras();
}



function limpiarCompra() {
    carritoCompras = [];
    renderCompras();
    document.getElementById('proveedor').value = '';
    document.getElementById('folio').value = '';
    document.getElementById('fecha-compra').value = hoy;
}



function guardarCompra() {
    const proveedor = document.getElementById('proveedor').value.trim();
    const folio = document.getElementById('folio').value.trim();

    if (!proveedor) {
        Swal.fire({ icon: 'warning', title: 'Falta el proveedor', text: 'Ingresa el nombre del proveedor' });
        return;
    }

    if (carritoCompras.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Sin productos', text: 'Agrega al menos un producto' });
        return;
    }

    const total = carritoCompras.reduce((acc, p) => acc + p.precio_compra * p.cantidad, 0);

    fetch('/guardar-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proveedor, folio, total, productos: carritoCompras })
    })
    .then(r => r.json())
    .then(data => {
        Swal.fire({ icon: 'success', title: '¡Compra guardada!', text: data.mensaje, confirmButtonColor: '#1565c0' })
        .then(() => {
            limpiarCompra();
            cargarResumen();
            cargarHistorial();
        });
    });
}



function cargarHistorial() {
    fetch('/historial-compras')
        .then(r => r.json())
        .then(compras => {
            const tbody = document.getElementById('tablaHistorial');
            tbody.innerHTML = '';

            compras.forEach(compra => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${compra.folio || '—'}</td>
                    <td>${new Date(compra.fecha).toLocaleDateString('es-MX')}</td>
                    <td>${compra.proveedor}</td>
                    <td>$${parseFloat(compra.total).toFixed(2)}</td>
                    <td>
                        <button class="btn-ver" onclick="verDetalle(${compra.id})">👁️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}



function verDetalle(id) {
    fetch(`/detalle-compra/${id}`)
        .then(r => r.json())
        .then(data => {
            const detalle = document.getElementById('detalle-compra');
            detalle.style.display = 'block';

            document.getElementById('detalle-folio').innerText = data.compra.folio || 'Sin folio';

            document.getElementById('detalle-info').innerHTML = `
                <div class="detalle-dato">
                    <span> Proveedor</span>
                    <strong>${data.compra.proveedor}</strong>
                </div>
                <div class="detalle-dato">
                    <span> Fecha</span>
                    <strong>${new Date(data.compra.fecha).toLocaleDateString('es-MX')}</strong>
                </div>
                <div class="detalle-dato">
                    <span> Total</span>
                    <strong>$${parseFloat(data.compra.total).toFixed(2)}</strong>
                </div>
            `;

            const tbody = document.getElementById('tablaDetalle');
            tbody.innerHTML = '';

            data.productos.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.nombre}</td>
                    <td>$${parseFloat(p.precio_compra).toFixed(2)}</td>
                    <td>${p.cantidad}</td>
                    <td>$${parseFloat(p.subtotal).toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('detalle-total').innerHTML = `
                <p>Total de productos: ${data.productos.reduce((a, p) => a + p.cantidad, 0)}</p>
                <p class="total-detalle">Total: <strong>$${parseFloat(data.compra.total).toFixed(2)}</strong></p>
            `;

            detalle.scrollIntoView({ behavior: 'smooth' });
        });
}