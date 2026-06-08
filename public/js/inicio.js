 let productosBajoStock = [];
    let productosSinStock = [];

    const diasTraducidos = {
        'Monday': 'Lun', 'Tuesday': 'Mar', 'Wednesday': 'Mie',
        'Thursday': 'Jue', 'Friday': 'Vie', 'Saturday': 'Sab', 'Sunday': 'Dom'
    };

   
    fetch('/estadisticas')
        .then(r => r.json())
        .then(data => {
            document.getElementById('total-productos').innerText = data.productos + ' productos';
            document.getElementById('bajo-stock').innerText = data.bajoStock + ' productos';
            document.getElementById('sin-stock').innerText = data.sinStock + ' productos';
        });


     fetch('/productos-bajo-stock')
    .then(r => r.json())
    .then(data => {
        productosBajoStock = data;
    });


     fetch('/productos-sin-stock')
    .then(r => r.json())
    .then(data => {
        productosSinStock = data;
    });

    
    Promise.all([
        fetch('/ventas-hoy').then(r => r.json()),
        fetch('/ventas-ayer').then(r => r.json())
    ])
    .then(([hoy, ayer]) => {
        const totalHoy = Number(hoy.totalVentas);
        const totalAyer = Number(ayer.totalVentas);

        document.getElementById('ventas-hoy').innerText = '$' + totalHoy.toFixed(2);

        const indicador = document.getElementById('indicador-ventas');

        if(totalAyer === 0){
            indicador.innerHTML = `<span class='sin-dato'>-</span>`;
            return;
        }

        const diferencia = ((totalHoy - totalAyer) / totalAyer) * 100;
        const esPositivo = diferencia >= 0;

        indicador.innerHTML = `
        <span class="porcentaje ${esPositivo ? 'positivo' : 'negativo'}">
            ${esPositivo ? '▲' : '▼'} ${Math.abs(diferencia).toFixed(1)}%
            </span>
            <small>vs ayer</small>
            `;
    });

    
    fetch('/ventas-semana')
        .then(r => r.json())
        .then(data => {
            const dias   = data.map(item => diasTraducidos[item.dia] || item.dia);
            const ventas = data.map(item => item.total);

            new Chart(document.getElementById('graficaVentas'), {
                type: 'line',
                data: {
                    labels: dias,
                    datasets: [{
                        label: 'Ventas',
                        data: ventas,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'white' } }
                    },
                    scales: {
                        x: { ticks: { color: 'white' } },
                        y: { ticks: { color: 'white' } }
                    }
                }
            });
        });

        // Utilidad del dia 
        fetch('/utilidad-inicio')
        .then(r => r.json())
        .then(data => {
            document.getElementById('utilidad-inicio').innerText = 
            '$' + Number(data.utilidad).toFixed(2);
        });

        
       function abrirModal(titulo, productos) {
        document.getElementById('modal-titulo').innerText = titulo;

        const tbody = document.getElementById('modal-tbody');
         tbody.innerHTML = '';

        if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="modal-vacio">
                    No hay productos en esta categoría
                </td>
            </tr>
        `;
    } else {
        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.stock}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('modal-stock').style.display = 'flex';
}


function cerrarModal() {
    document.getElementById('modal-stock').style.display = 'none';
}


document.getElementById('modal-stock').addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});