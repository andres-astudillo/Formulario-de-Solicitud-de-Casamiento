// Función para calcular la edad automáticamente
function calcularEdad(persona) {
    const fechaNacimiento = document.getElementById('fechaNacimiento' + persona).value;
    if (fechaNacimiento) {
        const hoy = new Date();
        const fechaNac = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const m = hoy.getMonth() - fechaNac.getMonth();
        
        if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        
        document.getElementById('edad' + persona).value = edad;
    }
}

// Función para mostrar/ocultar el campo de otra iglesia
function toggleIglesia(persona) {
    const asisteNo = document.getElementById('asisteNo' + persona).checked;
    document.getElementById('otraIglesiaGroup' + persona).style.display = asisteNo ? 'block' : 'none';
    
    // Si no asiste, hacemos que el campo sea requerido
    if (asisteNo) {
        document.getElementById('otraIglesia' + persona).setAttribute('required', '');
    } else {
        document.getElementById('otraIglesia' + persona).removeAttribute('required');
    }
}

// Función para mostrar/ocultar el campo de otra dirección
function toggleLugar() {
    const lugarOtro = document.getElementById('lugarOtro').checked;
    document.getElementById('otraDireccionGroup').classList.toggle('d-none', !lugarOtro);
    
    // Si es otro lugar, hacemos que el campo sea requerido
    if (lugarOtro) {
        document.getElementById('otraDireccion').setAttribute('required', '');
    } else {
        document.getElementById('otraDireccion').removeAttribute('required');
    }
    
    // Si cambiamos de lugar, verificamos nuevamente las restricciones de horario
    verificarFechaYHora();
}

// Función para verificar el horario en el salón 2020
function verificarHorario() {
    verificarFechaYHora();
}

// Función para verificar la fecha
function verificarFecha() {
    verificarFechaYHora();
}

// Función para verificar fecha y hora combinadas
function verificarFechaYHora() {
    const fechaCeremonia = document.getElementById('fechaCeremonia').value;
    const horaCeremonia = document.getElementById('horaCeremonia').value;
    const lugarSalon = document.getElementById('lugarSalon').checked;
    const timeWarning = document.getElementById('timeWarning');
    
    if (fechaCeremonia && horaCeremonia && lugarSalon) {
        const fecha = new Date(fechaCeremonia);
        const dia = fecha.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
        const hora = parseInt(horaCeremonia.split(':')[0]);
        const minutos = parseInt(horaCeremonia.split(':')[1]);
        
        // Si es viernes (5), sábado (6) o domingo (0) y la hora es mayor o igual a 18:00
        const esFinDeSemana = (dia === 5 || dia === 6 || dia === 0);
        const horaLimite = (hora > 18 || (hora === 18 && minutos > 0));
        
        if (esFinDeSemana && horaLimite) {
            timeWarning.style.display = 'block';
        } else {
            timeWarning.style.display = 'none';
        }
    } else {
        timeWarning.style.display = 'none';
    }
}

async function enviarDatosAGoogleSheets(formData) {
    // URL del script web desplegado de Google Apps Script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyrRs5qSy8BR7JRLpyAjMM5FZrw7L2vyGzA481VzklH6IA56X3VYZdV2AFH3T_IGqg/exec';
    
    try {
        // Convertir el FormData a un objeto
        const object = {};
        formData.forEach((value, key) => {
            object[key] = value;
        });
        
        // Crear un formulario oculto y enviarlo
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = scriptURL;
        form.target = 'hidden-iframe';
        form.style.display = 'none';
        
        // Crear un iframe oculto para recibir la respuesta
        const iframe = document.createElement('iframe');
        iframe.name = 'hidden-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Añadir cada campo del formulario como un input hidden
        for(const key in object) {
            if(object.hasOwnProperty(key)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = object[key];
                form.appendChild(input);
            }
        }
        
        // Añadir el formulario al DOM y enviarlo
        document.body.appendChild(form);
        form.submit();
        
        // Manejar la respuesta con un temporizador (no podemos acceder directamente por CORS)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Eliminar el form e iframe
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve(true); // Asumimos éxito después de enviar
            }, 2000);
        });
    } catch (error) {
        console.error('Error al enviar datos:', error);
        return false;
    }
}

// Validación de formulario antes de enviar
document.getElementById('matrimonioForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Primero validamos el formulario usando la API de validación de HTML5
    if (!this.checkValidity()) {
        e.stopPropagation();
        
        // Resaltar campos inválidos usando Bootstrap
        Array.from(this.elements).forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('is-invalid');
                
                // Mostrar mensaje específico si está disponible
                if (input.title) {
                    let errorMsg = document.createElement('div');
                    errorMsg.className = 'invalid-feedback';
                    errorMsg.textContent = input.title;
                    
                    // Eliminar mensajes de error previos
                    const prevErrors = input.parentNode.querySelectorAll('.invalid-feedback');
                    prevErrors.forEach(err => err.remove());
                    
                    input.parentNode.appendChild(errorMsg);
                }
            }
        });
        
        // Hacer scroll al primer campo inválido
        const invalidInputs = this.querySelectorAll('.is-invalid');
        if (invalidInputs.length > 0) {
            invalidInputs[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return;
    }
    
    // Validar restricciones adicionales (horario para el Salón 2020)
    const fechaCeremonia = document.getElementById('fechaCeremonia').value;
    const horaCeremonia = document.getElementById('horaCeremonia').value;
    const lugarSalon = document.getElementById('lugarSalon').checked;
    
    if (fechaCeremonia && horaCeremonia && lugarSalon) {
        const fecha = new Date(fechaCeremonia);
        const dia = fecha.getDay();
        const hora = parseInt(horaCeremonia.split(':')[0]);
        const minutos = parseInt(horaCeremonia.split(':')[1]);
        
        const esFinDeSemana = (dia === 5 || dia === 6 || dia === 0);
        const horaLimite = (hora > 18 || (hora === 18 && minutos > 0));
        
        if (esFinDeSemana && horaLimite) {
            if (!confirm('Los viernes, sábados y domingos la ceremonia en el Salón 2020 debe finalizar antes de las 18:00hs. ¿Desea continuar de todas formas?')) {
                document.getElementById('horaCeremonia').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
    }
    
    // Mostrar indicador de carga
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    
    // Recoger los datos del formulario
    const formData = new FormData(this);
    
    // Enviar datos a Google Sheets
    const exito = await enviarDatosAGoogleSheets(formData);
    
    // Ocultar indicador de carga
    document.getElementById('loadingIndicator').style.display = 'none';
    
    if (exito) {
        // Mostrar mensaje de éxito
        document.getElementById('successMessage').style.display = 'block';
        // Resetear el formulario
        this.reset();
        // Scroll al mensaje de éxito
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Mostrar mensaje de error
        document.getElementById('errorMessage').style.display = 'block';
        // Scroll al mensaje de error
        document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

// Para que los campos inválidos vuelvan a su estado normal al editarlos
document.querySelectorAll('input, textarea, select').forEach(element => {
    element.addEventListener('input', function() {
        this.classList.remove('is-invalid');
        const errorMsg = this.parentNode.querySelector('.invalid-feedback');
        if (errorMsg) {
            errorMsg.remove();
        }
    });
});