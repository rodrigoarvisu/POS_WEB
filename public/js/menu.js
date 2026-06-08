 function cerrarSesion() {
            localStorage.removeItem('usuario');
            window.location.replace('../index.html');
        }

        function actualizarHora() {
            const ahora = new Date();

            document.getElementById('hora').innerText = ahora.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            });

            document.getElementById('fecha').innerText = ahora.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }

        setInterval(actualizarHora, 1000);
        actualizarHora();

        
        const params = new URLSearchParams(window.location.search);
        const usuarioUrl = params.get('usuario');

        if (usuarioUrl) {
            localStorage.setItem('usuario', usuarioUrl);
        }

        const usuario = localStorage.getItem('usuario');

        if (!usuario) {
            window.location.replace('../index.html');
        }

        document.getElementById('usuario-actual').innerText = `usuario: ${usuario}`;

        if (params.get('login')) {
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Inicio de sesión correcto.'
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        
        function navegarDesdeInicio(pagina, titulo, subtitulo) {
            cargarPagina(pagina);
            cambiarTitulo(titulo, subtitulo);

            const links = document.querySelectorAll('.sidebar a');
            links.forEach(link => {
                link.classList.remove('activo');
                if(link.innerText.trim().includes(titulo)) {
                    link.classList.add('activo');
                }
            });
        }


        function activar(elemento) {
            document.querySelectorAll('.sidebar a').forEach(link => {
                link.classList.remove('activo');
            });
            elemento.classList.add('activo');
        }


        function cargarPagina(pagina) {
            document.getElementById('frame-contenido').contentWindow.location.replace(pagina);
        }

        
        function cambiarTitulo(titulo, subtitulo) {
            document.getElementById('titulo-pagina').innerText = titulo;
            document.getElementById('subtitulo-pagina').innerText = subtitulo;
        }

        const menu = document.querySelector(".sidebar");
        const boton = document.getElementById("toggleMenu");

        boton.addEventListener("click", () => {
            menu.classList.toggle("cerrado");
        });