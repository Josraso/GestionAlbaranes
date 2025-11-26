function recalcularTotales() {
    const selectedCodes = getSelectedCodes();

    if (selectedCodes.length === 0) {
        alert('Selecciona al menos un albarán');
        return;
    }

    if (!confirm('¿Recalcular totales para ' + selectedCodes.length + ' albarán(es)?')) {
        return;
    }

    // Crear formulario y enviarlo
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.href;

    // Añadir token CSRF
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_token';
    tokenInput.value = getCSRFToken();
    form.appendChild(tokenInput);

    // Añadir action
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'action';
    actionInput.value = 'recalcular-totales';
    form.appendChild(actionInput);

    // Añadir códigos seleccionados
    selectedCodes.forEach(code => {
        const codeInput = document.createElement('input');
        codeInput.type = 'hidden';
        codeInput.name = 'code[]';
        codeInput.value = code;
        form.appendChild(codeInput);
    });

    document.body.appendChild(form);
    form.submit();
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

    // Crear formulario y enviarlo
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.href;

    // Añadir token CSRF
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_token';
    tokenInput.value = getCSRFToken();
    form.appendChild(tokenInput);

    // Añadir action
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'action';
    actionInput.value = 'convertir-facturas';
    form.appendChild(actionInput);

    // Añadir códigos seleccionados
    selectedCodes.forEach(code => {
        const codeInput = document.createElement('input');
        codeInput.type = 'hidden';
        codeInput.name = 'code[]';
        codeInput.value = code;
        form.appendChild(codeInput);
    });

    document.body.appendChild(form);
    form.submit();
}

function getSelectedCodes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="code[]"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
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
