// dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // ==============================
    // 1. VERIFICAR AUTENTICACIÓN
    // ==============================
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('nombre') || 'Usuario';

    if (!token) {
        // Si no hay token, redirigir al login (puedes cambiar la ruta)
        alert('Debes iniciar sesión para acceder al dashboard.');
        window.location.href = 'login.html';
        return;
    }

    // ==============================
    // 2. MOSTRAR SALUDO Y FECHA
    // ==============================
    document.getElementById('saludoUsuario').textContent = `Bienvenido, ${nombre}`;
    const fecha = new Date();
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('fechaActual').textContent = fecha.toLocaleDateString('es-ES', opciones);

    // ==============================
    // 3. MOSTRAR/OCULTAR MENÚ SEGÚN ROL
    // ==============================
    if (rol === 'admin' || rol === 'tesorero') {
        document.getElementById('linkGestionCreditos').style.display = 'inline-block';
        document.getElementById('linkCajaPagos').style.display = 'inline-block';
        document.getElementById('linkReporteMora').style.display = 'inline-block';
    }
    // Si es socio, solo ve 'Solicitar Crédito' y 'Mi Perfil'
    // (ya están visibles por defecto, pero los ocultamos si no es socio?)
    // Mejor ocultamos 'Solicitar Crédito' si no es socio (aunque lo puede ver cualquiera)
    // Pero en el reglamento solo los socios pueden solicitar créditos.
    // Asumimos que 'socio' es el rol base.
    // si el rol es admin o tesorero, también pueden solicitar créditos.
    // Dejamos visible para todos.

    // ==============================
    // 4. CARGAR ESTADÍSTICAS
    // ==============================
    async function cargarEstadisticas() {
        try {
            // Suponemos un endpoint que devuelva todas las estadísticas en un solo objeto
            const res = await fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al obtener estadísticas');
            const data = await res.json();
            // Actualizar cards
            document.getElementById('totalSocios').textContent = data.totalSocios || 0;
            document.getElementById('totalCuentas').textContent = data.totalCuentas || 0;
            document.getElementById('totalCreditosActivos').textContent = data.totalCreditosActivos || 0;
            document.getElementById('totalAhorros').textContent = `Lps ${(data.totalAhorros || 0).toFixed(2)}`;
            document.getElementById('movimientosDia').textContent = data.movimientosDia || 0;
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            // Si falla, dejar valores en 0
        }
    }

    // ==============================
    // 5. CARGAR ÚLTIMOS MOVIMIENTOS
    // ==============================
    async function cargarMovimientos() {
        const tbody = document.getElementById('cuerpoMovimientos');
        try {
            const res = await fetch('/api/movimientos/ultimos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al obtener movimientos');
            const movimientos = await res.json();
            if (Array.isArray(movimientos) && movimientos.length > 0) {
                tbody.innerHTML = '';
                movimientos.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${m.fecha || ''}</td>
                        <td>${m.socio_nombre || 'N/A'}</td>
                        <td>${Number(m.monto).toFixed(2)}</td>
                        <td>${m.tipo || ''}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#6c757d;">No hay movimientos recientes.</td></tr>`;
            }
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#dc3545;">Error al cargar movimientos.</td></tr>`;
        }
    }

    // ==============================
    // 6. CERRAR SESIÓN
    // ==============================
    document.getElementById('btnCerrarSesion').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Seguro que deseas cerrar sesión?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('rol');
            localStorage.removeItem('socioId');
            localStorage.removeItem('nombre');
            window.location.href = 'login.html'; // o index.html
        }
    });

    cargarEstadisticas();
    cargarMovimientos();

});