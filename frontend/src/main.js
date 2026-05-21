// La dirección donde está escuchando tu backend
const API_URL = 'http://localhost:3000/socios';

// Agarramos los elementos de la pantalla
const form = document.getElementById('socioForm');
const tablaBody = document.querySelector('#tablaSocios tbody');
const socioIdInput = document.getElementById('socioId');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');

// 1. LEER: Función para traer los socios y armar la tabla
async function cargarSocios() {
  try {
    const respuesta = await fetch(API_URL);
    const socios = await respuesta.json();
    
    // Limpiamos la tabla antes de cargar
    tablaBody.innerHTML = '';
    
    // Recorremos los socios y creamos las filas
    socios.forEach(socio => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${socio.id}</td>
        <td>${socio.nombre}</td>
        <td>${socio.apellido}</td>
        <td>${socio.dni}</td>
        <td>${socio.plan}</td>
        <td>${socio.estado ? 'Activo' : 'Inactivo'}</td>
        <td>
          <button class="btn-editar" onclick="editarSocio(${socio.id}, '${socio.nombre}', '${socio.apellido}', '${socio.dni}', '${socio.plan}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarSocio(${socio.id})">Borrar</button>
        </td>
      `;
      tablaBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error al cargar los socios:", error);
  }
}

// 2. CREAR Y ACTUALIZAR: Qué pasa cuando apretamos "Guardar"
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Evitamos que la página se recargue
  
  const id = socioIdInput.value;
  const socioData = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    dni: document.getElementById('dni').value,
    plan: document.getElementById('plan').value,
    estado: true
  };

  try {
    if (id) {
      // Si el input oculto tiene un ID, significa que estamos Editando (PUT)
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioData)
      });
    } else {
      // Si no hay ID, es un socio Nuevo (POST)
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioData)
      });
    }
    
    // Reseteamos el formulario y recargamos la tabla
    form.reset();
    socioIdInput.value = '';
    btnCancelar.classList.add('hidden');
    btnGuardar.textContent = 'Guardar Socio';
    cargarSocios();
    
  } catch (error) {
    alert("Hubo un error al guardar el socio en la base de datos.");
  }
});

// 3. EDITAR: Preparamos el formulario con los datos del socio elegido
window.editarSocio = (id, nombre, apellido, dni, plan) => {
  socioIdInput.value = id;
  document.getElementById('nombre').value = nombre;
  document.getElementById('apellido').value = apellido;
  document.getElementById('dni').value = dni;
  document.getElementById('plan').value = plan;
  
  btnGuardar.textContent = 'Actualizar Socio';
  btnCancelar.classList.remove('hidden');
};

// Botón para cancelar la edición y limpiar todo
btnCancelar.addEventListener('click', () => {
  form.reset();
  socioIdInput.value = '';
  btnGuardar.textContent = 'Guardar Socio';
  btnCancelar.classList.add('hidden');
});

// 4. BORRAR: Eliminar un socio de la base de datos
window.eliminarSocio = async (id) => {
  if (confirm('¿Estás seguro de que querés dar de baja a este socio?')) {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      cargarSocios(); // Recargamos la tabla
    } catch (error) {
      alert("Error al intentar borrar.");
    }
  }
};

// Al arrancar la página, cargamos los datos por primera vez
cargarSocios();