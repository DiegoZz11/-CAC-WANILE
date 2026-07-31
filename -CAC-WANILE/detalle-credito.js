// detalle-credito.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión');
        window.location.href = 'login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const creditoId = params.get('id');
    if (!creditoId) {
        alert('ID de crédito no especificado');
        window.location.href = 'gestion-creditos.html';
        return;
    }

    // Cargar resumen del crédito
    fetch(`/api/creditos/${creditoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener el crédito');
        return res.json();
    })
    .then(data => {
        const resumen = document.getElementById('resumenCredito');
        resumen.innerHTML = `
            <div class="campo"><strong>ID:</strong> ${data.id}</div>
            <div class="campo"><strong>Socio:</strong> ${data.socio_nombre || 'N/A'}</div>
            <div class="campo"><strong>Monto Solicitado:</strong> Lps ${Number(data.monto_solicitado).toFixed(2)}</div>
            <div class="campo"><strong>Monto Aprobado:</strong> ${data.monto_aprobado ? 'Lps ' + Number(data.monto_aprobado).toFixed(2) : '—'}</div>
            <div class="campo"><strong>Tasa:</strong> ${data.tasa_interes_mensual}%</div>
            <div class="campo"><strong>Plazo:</strong> ${data.plazo_meses} meses</div>
            <div class="campo"><strong>Estado:</strong> <span class="badge badge-${data.estado}">${data.estado}</span></div>
        `;
    })
    .catch(error => {
        document.getElementById('resumenCredito').innerHTML = `<div class="sin-resultados">❌ Error al cargar el crédito: ${error.message}</div>`;
    });

    // Cargar plan de pagos
    fetch(`/api/creditos/${creditoId}/plan-pagos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener el plan de pagos');
        return res.json();
    })
    .then(plan => {
        const tbody = document.getElementById('cuerpoPlan');
        if (Array.isArray(plan) && plan.length > 0) {
            tbody.innerHTML = '';
            plan.forEach(cuota => {
                const tr = document.createElement('tr');
                const estadoClass = `badge-${cuota.estado}`;
                tr.innerHTML = `
                    <td>${cuota.numero_cuota}</td>
                    <td>${cuota.fecha_vencimiento}</td>
                    <td>${Number(cuota.monto_capital).toFixed(2)}</td>
                    <td>${Number(cuota.monto_interes).toFixed(2)}</td>
                    <td>${Number(cuota.monto_total).toFixed(2)}</td>
                    <td>${Number(cuota.saldo_restante).toFixed(2)}</td>
                    <td><span class="badge ${estadoClass}">${cuota.estado}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="sin-resultados">No hay cuotas registradas</td></tr>`;
        }
    })
    .catch(error => {
        document.getElementById('cuerpoPlan').innerHTML = `<tr><td colspan="7" class="sin-resultados">❌ Error al cargar el plan: ${error.message}</td></tr>`;
    });
});