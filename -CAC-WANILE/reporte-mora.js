// reporte-mora.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión');
        window.location.href = 'login.html';
        return;
    }

    const rol = localStorage.getItem('rol');
    if (rol !== 'admin' && rol !== 'tesorero') {
        alert('No tienes permisos para ver este reporte');
        window.location.href = 'dashboard.html';
        return;
    }

    const tbody = document.getElementById('cuerpoMora');
    const btnRefrescar = document.getElementById('btnRefrescar');

    cargarReporte();
    btnRefrescar.addEventListener('click', cargarReporte);

    async function cargarReporte() {
        tbody.innerHTML = `<tr><td colspan="8" class="cargando">Cargando reporte de mora...</td></tr>`;
        try {
            const res = await fetch('/api/reportes/mora', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar reporte');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                tbody.innerHTML = '';
                data.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.socio_nombre || 'N/A'}</td>
                        <td>${item.credito_id}</td>
                        <td>${item.numero_cuota}</td>
                        <td>${item.fecha_vencimiento}</td>
                        <td>${item.dias_atraso}</td>
                        <td>${Number(item.monto_adeudado).toFixed(2)}</td>
                        <td>${Number(item.mora).toFixed(2)}</td>
                        <td><strong>${Number(item.total).toFixed(2)}</strong></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="sin-resultados">✅ No hay socios en mora</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="8" class="sin-resultados">❌ Error al cargar reporte: ${error.message}</td></tr>`;
        }
    }
});