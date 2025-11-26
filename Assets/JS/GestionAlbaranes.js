function recalcularTotales() {
    const selectedCodes = getSelectedCodes();
    
    if (selectedCodes.length === 0) {
        return;
    }
    
    // Crear formulario y enviarlo
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.href;
    
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
        return;
    }
    
    // Crear formulario y enviarlo
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.href;
    
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
