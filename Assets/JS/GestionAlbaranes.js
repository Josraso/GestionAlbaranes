console.log('GestionAlbaranes.js loaded successfully');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Buscando botones...');

    // Buscar botones por su texto
    const buttons = document.querySelectorAll('button');
    let recalcularBtn = null;
    let convertirBtn = null;

    buttons.forEach(btn => {
        console.log('Botón encontrado:', btn.textContent);
        if (btn.textContent.includes('Recalcular totales')) {
            recalcularBtn = btn;
            console.log('Botón "Recalcular totales" encontrado');
        }
        if (btn.textContent.includes('Convertir a facturas')) {
            convertirBtn = btn;
            console.log('Botón "Convertir a facturas" encontrado');
        }
    });

    // Agregar listeners a los botones
    if (recalcularBtn) {
        console.log('Agregando listener a recalcularBtn');
        recalcularBtn.addEventListener('click', function(e) {
            console.log('Click en Recalcular totales');
            e.preventDefault();
            recalcularTotales();
            return false;
        });
    }

    if (convertirBtn) {
        console.log('Agregando listener a convertirBtn');
        convertirBtn.addEventListener('click', function(e) {
            console.log('Click en Convertir a facturas');
            e.preventDefault();
            convertirFacturas();
            return false;
        });
    }
});

function recalcularTotales() {
    console.log('recalcularTotales function called');
    const selectedCodes = getSelectedCodes();

    if (selectedCodes.length === 0) {
        alert('Selecciona al menos un albarán');
        return;
    }

    if (!confirm('¿Recalcular totales para ' + selectedCodes.length + ' albarán(es)?')) {
        return;
    }

    // Usar AJAX para enviar los datos
    const formData = new FormData();
    formData.append('action', 'recalcular-totales');
    formData.append('_token', getCSRFToken());

    selectedCodes.forEach(code => {
        formData.append('code[]', code);
    });

    console.log('Enviando recalcularTotales con códigos:', selectedCodes);

    fetch(window.location.href, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.text();
    })
    .then(data => {
        console.log('Response data:', data);
        alert('Albaranes recalculados. Recargando...');
        location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al recalcular totales: ' + error);
    });
}

function convertirFacturas() {
    console.log('convertirFacturas function called');
    const selectedCodes = getSelectedCodes();

    if (selectedCodes.length === 0) {
        alert('Selecciona al menos un albarán');
        return;
    }

    if (!confirm('¿Convertir a facturas ' + selectedCodes.length + ' albarán(es)? Esta acción es irreversible.')) {
        return;
    }

    // Usar AJAX para enviar los datos
    const formData = new FormData();
    formData.append('action', 'convertir-facturas');
    formData.append('_token', getCSRFToken());

    selectedCodes.forEach(code => {
        formData.append('code[]', code);
    });

    console.log('Enviando convertirFacturas con códigos:', selectedCodes);

    fetch(window.location.href, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.text();
    })
    .then(data => {
        console.log('Response data:', data);
        alert('Albaranes convertidos a facturas. Recargando...');
        location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al convertir a facturas: ' + error);
    });
}

function getSelectedCodes() {
    // Buscar checkboxes con nombre "code[]" (FacturaScripts estándar)
    let checkboxes = document.querySelectorAll('input[type="checkbox"][name="code[]"]:checked');
    if (checkboxes.length > 0) {
        return Array.from(checkboxes).map(cb => cb.value);
    }

    // Fallback: buscar cualquier checkbox seleccionado en un formulario de lista
    checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    let codes = [];
    checkboxes.forEach(cb => {
        if (cb.name && cb.name !== '_token' && cb.name !== 'action') {
            codes.push(cb.value);
        }
    });
    return codes;
}

function getCSRFToken() {
    // Buscar el token en meta tags
    let token = document.querySelector('meta[name="_token"]');
    if (token) {
        return token.getAttribute('content');
    }

    // Si no está en meta, buscar en input hidden del formulario
    token = document.querySelector('input[name="_token"]');
    if (token) {
        return token.value;
    }

    // Fallback: intentar buscar en cualquier formulario
    token = document.querySelector('form input[name="_token"]');
    if (token) {
        return token.value;
    }

    console.warn('Token CSRF no encontrado');
    return '';
}
