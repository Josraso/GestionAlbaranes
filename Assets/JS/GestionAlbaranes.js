console.log('GestionAlbaranes.js loaded successfully');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Creando formulario oculto');

    // Crear un formulario oculto para enviar nuestras acciones
    const hiddenForm = document.createElement('form');
    hiddenForm.id = 'gestionAlbaranesForm';
    hiddenForm.method = 'POST';
    hiddenForm.style.display = 'none';

    // Crear inputs ocultos en el formulario
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'action';
    actionInput.id = 'actionInput';
    hiddenForm.appendChild(actionInput);

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_token';
    tokenInput.id = 'tokenInput';
    tokenInput.value = getCSRFToken();
    hiddenForm.appendChild(tokenInput);

    document.body.appendChild(hiddenForm);

    // Buscar botones por su texto
    const buttons = document.querySelectorAll('button');
    let recalcularBtn = null;
    let convertirBtn = null;

    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Recalcular totales') || text.includes('Recalcul')) {
            recalcularBtn = btn;
            console.log('Botón "Recalcular totales" encontrado');
        }
        if (text.includes('Convertir a facturas') || text.includes('Converti')) {
            convertirBtn = btn;
            console.log('Botón "Convertir a facturas" encontrado');
        }
    });

    // Agregar listeners a los botones
    if (recalcularBtn) {
        console.log('Agregando listener a recalcularBtn');
        recalcularBtn.addEventListener('click', function(e) {
            console.log('Click en Recalcular totales detectado');
            e.preventDefault();
            e.stopPropagation();
            recalcularTotales();
            return false;
        }, true); // usar capture phase
    }

    if (convertirBtn) {
        console.log('Agregando listener a convertirBtn');
        convertirBtn.addEventListener('click', function(e) {
            console.log('Click en Convertir a facturas detectado');
            e.preventDefault();
            e.stopPropagation();
            convertirFacturas();
            return false;
        }, true); // usar capture phase
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

    // Obtener el formulario principal
    const mainForm = document.querySelector('form:not(#gestionAlbaranesForm)');
    if (!mainForm) {
        alert('No se encontró el formulario principal');
        return;
    }

    // Llenar el formulario oculto con los datos
    const hiddenForm = document.getElementById('gestionAlbaranesForm');
    document.getElementById('actionInput').value = 'recalcular-totales';

    // Agregar checkboxes al formulario oculto
    selectedCodes.forEach(code => {
        const codeInput = document.createElement('input');
        codeInput.type = 'hidden';
        codeInput.name = 'code[]';
        codeInput.value = code;
        hiddenForm.appendChild(codeInput);
    });

    // Establecer la acción del formulario a la URL actual
    hiddenForm.action = window.location.href;

    console.log('Enviando formulario con códigos:', selectedCodes);

    // Enviar el formulario
    hiddenForm.submit();
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

    // Obtener el formulario principal
    const mainForm = document.querySelector('form:not(#gestionAlbaranesForm)');
    if (!mainForm) {
        alert('No se encontró el formulario principal');
        return;
    }

    // Llenar el formulario oculto con los datos
    const hiddenForm = document.getElementById('gestionAlbaranesForm');
    document.getElementById('actionInput').value = 'convertir-facturas';

    // Agregar checkboxes al formulario oculto
    selectedCodes.forEach(code => {
        const codeInput = document.createElement('input');
        codeInput.type = 'hidden';
        codeInput.name = 'code[]';
        codeInput.value = code;
        hiddenForm.appendChild(codeInput);
    });

    // Establecer la acción del formulario a la URL actual
    hiddenForm.action = window.location.href;

    console.log('Enviando formulario con códigos:', selectedCodes);

    // Enviar el formulario
    hiddenForm.submit();
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
