// solicitar-credito.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formSolicitarCredito');
    const mensajeDiv = document.getElementById('mensaje');

    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        mensajeDiv.textContent = '⚠️ No has iniciado sesión. Redirigiendo...';
        mensajeDiv.className = 'mensaje error';
        setTimeout(() => {
            window.location.href = 'login.html'; // Ajusta según tu login
        }, 2000);
        return;
    }

    // Obtener el socioId desde localStorage (debe guardarse al hacer login)
    const socioId = localStorage.getItem('socioId');
    if (!socioId) {
        mensajeDiv.textContent = '⚠️ No se encontró información del socio. Contacte al administrador.';
        mensajeDiv.className = 'mensaje error';
        form.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Deshabilitar el botón para evitar envíos múltiples
        const btn = form.querySelector('.btn-enviar');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        // Obtener datos
        const monto = parseFloat(document.getElementById('monto').value);
        const plazo = parseInt(document.getElementById('plazo').value);
        const tasa = parseFloat(document.getElementById('tasa').value);

        // Validaciones adicionales
        if (isNaN(monto) || monto < 1000) {
            mostrarMensaje('El monto mínimo es de Lps 1,000', 'error');
            btn.disabled = false;
            btn.textContent = 'Enviar solicitud';
            return;
        }
        if (isNaN(plazo) || plazo < 6) {
            mostrarMensaje('El plazo mínimo es de 6 meses', 'error');
            btn.disabled = false;
            btn.textContent = 'Enviar solicitud';
            return;
        }

        // Construir el objeto a enviar
        const payload = {
            socioId: parseInt(socioId),
            monto: monto,
            plazo: plazo,
            tasa: tasa
        };

        try {
            const response = await fetch('/api/creditos/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensaje(`✅ Solicitud enviada con éxito. N° de solicitud: ${data.creditoId || 'generado'}.`, 'exito');
                form.reset();
            } else {
                const msg = data.message || 'Ocurrió un error al procesar la solicitud.';
                mostrarMensaje(`❌ ${msg}`, 'error');
            }
        } catch (error) {
            console.error('Error de red:', error);
            mostrarMensaje('❌ Error de conexión. Verifique su internet e intente de nuevo.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar solicitud';
        }
    });

    // Función para mostrar mensajes
    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        // Ocultar después de 8 segundos si es éxito
        if (tipo === 'exito') {
            setTimeout(() => {
                mensajeDiv.className = 'mensaje';
            }, 8000);
        }
    }
});