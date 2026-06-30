// La dirección donde está escuchando tu backend
const API_URL = 'http://localhost:3000/socios';

// Agarramos los elementos de la pantalla
const form = document.getElementById('socioForm');
const tablaBody = document.querySelector('#tablaSocios tbody');
const socioIdInput = document.getElementById('socioId');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');
const fechaPagoInput = document.getElementById('fechaPago');
const searchInput = document.getElementById('searchInput');
const mensajeAccion = document.getElementById('mensajeAccion');
const statsTotal = document.getElementById('statsTotal');
const statsActivos = document.getElementById('statsActivos');
const statsInactivos = document.getElementById('statsInactivos');

let sociosCache = [];

function formatDate(fecha) {
  if (!fecha) return 'Sin pago';
  // Si viene con formato ISO de la base de datos lo limpiamos para mostrar local
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return 'Sin pago';
  return date.toLocaleDateString('es-AR');
}

async function cargarSocios() {
  try {
    const respuesta = await fetch(API_URL);
    const socios = await respuesta.json();
    sociosCache = socios;
    renderSocios(sociosCache);
    updateStats(sociosCache);
  } catch (error) {
    console.error('Error al cargar los socios:', error);
  }
}

function renderSocios(socios) {
  tablaBody.innerHTML = '';

  socios.forEach(socio => {
    const tr = document.createElement('tr');
    const estadoValue = socio.estado || 'Inactivo';
    const badgeClass = estadoValue === 'Activo' ? 'estado-activo' : 'estado-inactivo';
    const fechaPagoText = formatDate(socio.fechaPago);

    tr.innerHTML = `
      <td>${socio.id}</td>
      <td>${socio.nombre}</td>
      <td>${socio.apellido}</td>
      <td>${socio.dni}</td>
      <td>${socio.plan}</td>
      <td>${fechaPagoText}</td>
      <td>
        <span class="estado-badge ${badgeClass}">${estadoValue}</span>
      </td>
      <td class="celda-acciones">
        </td>
    `;

    const tdAcciones = tr.querySelector('.celda-acciones');

    // Botón Cambiar Estado (Alternador rápido)
    const btnEstado = document.createElement('button');
    if (estadoValue === 'Activo') {
      btnEstado.className = 'btn-inactivo';
      btnEstado.textContent = 'Desactivar';
      btnEstado.addEventListener('click', () => setEstado(socio.id, 'Inactivo'));
    } else {
      btnEstado.className = 'btn-activo';
      btnEstado.textContent = 'Activar';
      btnEstado.addEventListener('click', () => setEstado(socio.id, 'Activo'));
    }

    // Botón Editar clásico
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.type = 'button';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => editarSocio(socio));

    // Botón Borrar clásico
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'Borrar';
    btnEliminar.addEventListener('click', () => eliminarSocio(socio.id));

    // Estructuramos todos en la misma fila de acciones
    tdAcciones.append(btnEstado, btnEditar, btnEliminar);
    tablaBody.appendChild(tr);
  });
}

function mostrarMensaje(texto, tipo = 'info') {
  if (!mensajeAccion) return;
  mensajeAccion.textContent = texto;
  mensajeAccion.className = `mensaje-accion mensaje-${tipo}`;
  mensajeAccion.classList.remove('hidden');
  setTimeout(() => {
    mensajeAccion.classList.add('hidden');
  }, 2500);
}

function updateStats(socios) {
  if (!statsTotal || !statsActivos || !statsInactivos) return;
  statsTotal.textContent = socios.length;
  statsActivos.textContent = socios.filter(s => s.estado === 'Activo').length;
  statsInactivos.textContent = socios.filter(s => s.estado === 'Inactivo').length;
}

function filtrarSocios() {
  const termino = searchInput.value.trim().toLowerCase();
  if (!termino) {
    renderSocios(sociosCache);
    return;
  }
  const sociosFiltrados = sociosCache.filter(socio => {
    return socio.nombre.toLowerCase().includes(termino) || socio.dni.toLowerCase().includes(termino);
  });
  renderSocios(sociosFiltrados);
}

searchInput.addEventListener('input', filtrarSocios);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = socioIdInput.value;
  const socioData = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    dni: document.getElementById('dni').value,
    plan: document.getElementById('plan').value,
    fechaPago: fechaPagoInput.value ? new Date(fechaPagoInput.value).toISOString() : new Date().toISOString()
  };

  try {
    if (id) {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioData)
      });
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioData)
      });
    }

    form.reset();
    socioIdInput.value = '';
    btnCancelar.classList.add('hidden');
    btnGuardar.textContent = 'Guardar Socio';
    cargarSocios();
  } catch (error) {
    alert('Hubo un error al guardar el socio en la base de datos.');
  }
});

window.editarSocio = (socio) => {
  socioIdInput.value = socio.id;
  document.getElementById('nombre').value = socio.nombre;
  document.getElementById('apellido').value = socio.apellido;
  document.getElementById('dni').value = socio.dni;
  document.getElementById('plan').value = socio.plan;
  fechaPagoInput.value = socio.fechaPago ? socio.fechaPago.split('T')[0] : '';

  btnGuardar.textContent = 'Actualizar Socio';
  btnCancelar.classList.remove('hidden');
};

btnCancelar.addEventListener('click', () => {
  form.reset();
  socioIdInput.value = '';
  btnGuardar.textContent = 'Guardar Socio';
  btnCancelar.classList.add('hidden');
});

window.eliminarSocio = async (id) => {
  if (confirm('¿Estás seguro de que querés dar de baja a este socio?')) {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      cargarSocios();
    } catch (error) {
      alert('Error al intentar borrar.');
    }
  }
};

window.setEstado = async (id, estadoDeseado) => {
  try {
    const response = await fetch(`${API_URL}/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: estadoDeseado })
    });
    if (!response.ok) throw new Error('No se pudo cambiar el estado');
    cargarSocios();
  } catch (error) {
    console.error('Error al cambiar el estado:', error);
  }
};

cargarSocios();