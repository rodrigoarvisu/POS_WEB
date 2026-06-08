 document.querySelectorAll('.btn-filtro')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filtro')
                .forEach(b => {
                    b.classList.remove('activo');
                });
                btn.classList.add('activo');

                const periodo = btn.innerText.trim();

                document.getElementById('titulo-grafica')
                .innerText = 'Productos mas vendidos ' + periodo.toLowerCase() + '...';

                obtenerReportes(periodo);
                obtenerProductosMasVendidos(periodo);
            });
        });

        function obtenerReportes(periodo){
            fetch('/obtener-reportes/' + periodo)
            .then(response => response.json())
            .then(data => {
                
                document.getElementById('ventas')
                .innerText = 
                Number(data.ventas).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                });

                document.getElementById('compras')
                .innerText = 
                Number(data.compras).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                });

                document.getElementById('utilidad')
                .innerText = 
                Number(data.utilidad).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                });

                document.getElementById('ticket')
                .innerText = 
                Number(data.ticketPromedio).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                });
            })
        }

        obtenerReportes('Hoy');

        obtenerProductosMasVendidos('Hoy');

        let grafica = null;


        function crearGrafica(labels, datos){
            const ctx = document.getElementById('graficaVentas')

            if(grafica){
                grafica.destroy();
            }

            grafica = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Productos mas vendidos',
                        data: datos,
                        borderWidth: 1,
                        barThickness: 25,
                        maxBarThickness: 25,
                        categoryPercentage: 1.0,
                        barPercentage: 1.0
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                color: 'white'
                            }
                        },
                        y: {
                            ticks: {
                                color: 'white'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'white'
                            }
                        }
                    },
                }
            });
        }
       
        function obtenerProductosMasVendidos(periodo){
            fetch('/productos-mas-vendidos/' + periodo)
            .then(response => response.json())
            .then(data => {
                const labels = data.map(p => p.nombre);
                const valores = data.map(p => p.vendidos);

                crearGrafica(labels, valores);
            });
        }