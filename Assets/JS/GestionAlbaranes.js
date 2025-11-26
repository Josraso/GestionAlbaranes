function recalcularTotales() {
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
