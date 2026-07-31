// caja-pagos.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión');
        window.location.href = 'login.html';
        return;
    }

    // Solo tesorero/admin
    const rol = localStorage.getItem('rol');
    if (rol !== 'admin' && rol !== 'tesorero') {
        alert('No tienes permisos para acceder a esta sección');
        window.location.href = 'dashboard.html';
        return;
    }

    const inputBuscar = document.getElementById('buscarSocio');
    const btnBuscar = document.getElementById('btnBuscar');
    const infoSocio = document.getElementById('infoSocio');
    const tbody = document.getElementById('cuerpoCuotas');

    let socioSeleccionado = null;

    btnBuscar.addEventListener('click', buscarSocio);
    inputBuscar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') buscarSocio();
    });

    async function buscarSocio() {
        const query = inputBuscar.value.trim();
        if (!query) {
            alert('Ingrese un término de búsqueda');
            return;
        }

        try {
            const res = await fetch(`/api/socios/buscar?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al buscar socio');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                socioSeleccionado = data[0];
                mostrarSocio(socioSeleccionado);
                cargarCuotasPendientes(socioSeleccionado.id);
            } else {
                infoSocio.style.display = 'none';
                tbody.innerHTML = `<tr><td colspan="8" class="sin-resultados">No se encontró el socio</td></tr>`;
            }
        } catch (error) {
            alert('Error al buscar socio: ' + error.message);
        }
    }

    function mostrarSocio(socio) {
        infoSocio.style.display = 'block';
        infoSocio.innerHTML = `
            <h3>${socio.nombre || 'Sin nombre'}</h3>
            <p><strong>Cédula:</strong> ${socio.cedula || '—'} | <strong>Teléfono:</strong> ${socio.telefono || '—'}</p>
        `;
    }

    async function cargarCuotasPendientes(socioId) {
        try {
            const res = await fetch(`/api/creditos/socio/${socioId}/pendientes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar cuotas');
            const cuotas = await res.json();
            if (Array.isArray(cuotas) && cuotas.length > 0) {
                tbody.innerHTML = '';
                cuotas.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${c.credito_id}</td>
                        <td>${c.numero_cuota}</td>
                        <td>${c.fecha_vencimiento}</td>
                        <td>${Number(c.monto_capital).toFixed(2)}</td>
                        <td>${Number(c.monto_interes).toFixed(2)}</td>
                        <td>${Number(c.monto_total).toFixed(2)}</td>
                        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
                        <td><button class="btn-pagar" data-id="${c.id}" data-credito="${c.credito_id}" data-cuota="${c.numero_cuota}" data-total="${c.monto_total}">Pagar</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                // Asignar eventos a los botones de pago
                document.querySelectorAll('.btn-pagar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const planPagoId = this.dataset.id;
                        const cuotaNumero = this.dataset.cuota;
                        const montoTotal = parseFloat(this.dataset.total);
                        abrirModalPago(planPagoId, cuotaNumero, montoTotal);
                    });
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="sin-resultados">No hay cuotas pendientes para este socio</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="8" class="sin-resultados">Error: ${error.message}</td></tr>`;
        }
    }

    // ======================
    //  MODAL PAGO
    // ======================
    const modal = document.getElementById('modalPago');
    const inputPlanPagoId = document.getElementById('planPagoId');
    const spanCuotaNumero = document.getElementById('cuotaNumero');
    const spanMontoTotal = document.getElementById('montoTotal');
    const spanMontoMora = document.getElementById('montoMora');
    const spanTotalPagar = document.getElementById('totalPagar');
    const inputFechaPago = document.getElementById('fechaPago');
    const btnCancelar = document.getElementById('btnCancelarPago');
    const btnConfirmar = document.getElementById('btnConfirmarPago');

    let montoCuota = 0;

    function abrirModalPago(planPagoId, cuotaNumero, montoTotal) {
        inputPlanPagoId.value = planPagoId;
        spanCuotaNumero.textContent = cuotaNumero;
        montoCuota = montoTotal;
        spanMontoTotal.textContent = `Lps ${montoTotal.toFixed(2)}`;
        spanMontoMora.textContent = 'Lps 0.00';
        spanTotalPagar.textContent = `Lps ${montoTotal.toFixed(2)}`;
        inputFechaPago.value = new Date().toISOString().split('T')[0];
        modal.style.display = 'flex';
        calcularMora(); // Calcular si hay mora
    }

    function cerrarModal() {
        modal.style.display = 'none';
    }

    btnCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) cerrarModal();
    });

    // Calcular mora al cambiar la fecha
    inputFechaPago.addEventListener('change', calcularMora);

    async function calcularMora() {
        const planPagoId = inputPlanPagoId.value;
        if (!planPagoId) return;
        const fechaPago = inputFechaPago.value;
        if (!fechaPago) return;

        try {
            const res = await fetch(`/api/plan-pagos/${planPagoId}/mora?fecha=${fechaPago}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al calcular mora');
            const data = await res.json();
            const mora = data.mora || 0;
            spanMontoMora.textContent = `Lps ${mora.toFixed(2)}`;
            const total = montoCuota + mora;
            spanTotalPagar.textContent = `Lps ${total.toFixed(2)}`;
        } catch (error) {
            console.error('Error al calcular mora:', error);
            spanMontoMora.textContent = 'Lps 0.00';
            spanTotalPagar.textContent = `Lps ${montoCuota.toFixed(2)}`;
        }
    }

    btnConfirmar.addEventListener('click', async function() {
        const planPagoId = inputPlanPagoId.value;
        const fechaPago = inputFechaPago.value;
        if (!planPagoId || !fechaPago) {
            alert('Faltan datos');
            return;
        }

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Procesando...';

        try {
            const res = await fetch('/api/pagos/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planPagoId, fechaPago })
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ Pago registrado correctamente');
                cerrarModal();
                // Recargar cuotas pendientes del socio
                if (socioSeleccionado) {
                    cargarCuotasPendientes(socioSeleccionado.id);
                }
            } else {
                alert(`❌ Error: ${data.message || 'No se pudo registrar el pago'}`);
            }
        } catch (error) {
            alert('❌ Error de red: ' + error.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Pagar';
        }
    });
});