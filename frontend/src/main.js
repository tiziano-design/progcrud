// La dirección donde está escuchando tu backend
const API_URL = 'http://localhost:3000';

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
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginStatus = document.getElementById('loginStatus');
const loginButton = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const appContent = document.getElementById('appContent');

let sociosCache = [];
let authToken = localStorage.getItem('gymToken') || '';

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

function setAuthUi() {
  const isLogged = Boolean(authToken);

  form.querySelectorAll('input, select, button').forEach((element) => {
    element.disabled = !isLogged;
  });
  searchInput.disabled = !isLogged;
  btnLogout.classList.toggle('hidden', !isLogged);
  document.getElementById('authNotice').classList.toggle('hidden', isLogged);
  appContent.classList.toggle('hidden', !isLogged);
  loginForm.classList.toggle('logged-in', isLogged);

  if (!isLogged) {
    loginStatus.textContent = 'Iniciá sesión para usar la app.';
    loginStatus.classList.remove('success', 'error');
  }
}

function formatDate(fecha) {
  if (!fecha) return 'Sin pago';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Sin pago';
  return date.toLocaleDateString('es-AR');
}

function mostrarFeedback(mensaje, tipo = 'info') {
  let contenedorAlertas = document.querySelector('#feedback-container');
  if (!contenedorAlertas) {
    contenedorAlertas = document.createElement('div');
    contenedorAlertas.id = 'feedback-container';
    document.body.appendChild(contenedorAlertas);
  }

  const alerta = document.createElement('div');
  alerta.className = `alerta ${tipo}`;
  alerta.textContent = mensaje;
  contenedorAlertas.appendChild(alerta);

  window.setTimeout(() => {
    alerta.style.opacity = '0';
    window.setTimeout(() => alerta.remove(), 500);
  }, 4000);
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

function limpiarFormulario() {
  form.reset();
  socioIdInput.value = '';
  btnCancelar.classList.add('hidden');
  btnGuardar.textContent = 'Guardar Socio';
}

async function cargarSocios() {
  if (!authToken) {
    sociosCache = [];
    renderSocios([]);
    updateStats([]);
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/socios`, {
      headers: getAuthHeaders()
    });
    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudieron cargar los socios.');
    }

    const socios = await respuesta.json();
    sociosCache = socios;
    renderSocios(sociosCache);
    updateStats(sociosCache);
  } catch (error) {
    console.error('Error al cargar los socios:', error);
    mostrarFeedback('No se pudieron cargar los socios.', 'error');
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
      <td class="celda-acciones"></td>
    `;

    const tdAcciones = tr.querySelector('.celda-acciones');

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

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.type = 'button';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => editarSocio(socio));

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.type = 'button';
    btnEliminar.textContent = 'Borrar';
    btnEliminar.addEventListener('click', () => eliminarSocio(socio.id, socio.nombre));

    tdAcciones.append(btnEstado, btnEditar, btnEliminar);
    tablaBody.appendChild(tr);
  });
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

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginStatus.textContent = 'Completá el email y la contraseña antes de iniciar sesión.';
    return;
  }

  loginButton.textContent = 'Iniciando...';
  loginButton.disabled = true;
  loginStatus.textContent = 'Intentando iniciar sesión...';

  try {
    const respuesta = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(data.message || 'No se pudo iniciar sesión.');
    }

    authToken = data.token;
    localStorage.setItem('gymToken', authToken);
    loginStatus.textContent = `Sesión iniciada como ${data.user?.email || 'usuario'} (${data.user?.role || 'usuario'}).`;
    loginStatus.classList.remove('error');
    loginStatus.classList.add('success');
    loginForm.reset();
    setAuthUi();
    await cargarSocios();
  } catch (error) {
    if (error instanceof TypeError) {
      loginStatus.textContent = 'No se pudo conectar al servidor. Verificá que el backend esté corriendo en http://localhost:3000.';
    } else {
      loginStatus.textContent = error.message || 'Error al iniciar sesión.';
    }
    loginStatus.classList.remove('success');
    loginStatus.classList.add('error');
  } finally {
    loginButton.textContent = 'Iniciar sesión';
    loginButton.disabled = false;
  }
});

btnLogout.addEventListener('click', () => {
  authToken = '';
  localStorage.removeItem('gymToken');
  setAuthUi();
  limpiarFormulario();
  renderSocios([]);
  updateStats([]);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const dni = document.getElementById('dni').value.trim();
  const plan = document.getElementById('plan').value;
  const id = socioIdInput.value;

  if (!nombre || !apellido || !dni || !plan) {
    mostrarFeedback('Por favor, completa todos los campos obligatorios.', 'error');
    return;
  }

  const dniNumero = Number(dni);
  if (Number.isNaN(dniNumero) || !Number.isInteger(dniNumero) || dniNumero <= 0) {
    mostrarFeedback('El DNI debe ser un número positivo.', 'error');
    return;
  }

  const modoEdicion = Boolean(id);
  const datos = {
    nombre,
    apellido,
    dni,
    plan,
    fechaPago: fechaPagoInput.value ? new Date(fechaPagoInput.value).toISOString() : new Date().toISOString()
  };

  try {
    let res;
    if (modoEdicion) {
      res = await fetch(`${API_URL}/socios/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos)
      });
    } else {
      res = await fetch(`${API_URL}/socios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos)
      });
    }

    const resultado = await res.json().catch(() => ({}));

    if (!res.ok) {
      mostrarFeedback(resultado.message || 'Error en la operación.', 'error');
      mostrarMensaje(resultado.message || 'Error en la operación.', 'error');
    } else {
      mostrarFeedback(modoEdicion ? '¡Socio editado correctamente!' : '¡Socio dado de alta con éxito!', 'success');
      mostrarMensaje(modoEdicion ? '¡Socio editado correctamente!' : '¡Socio dado de alta con éxito!', 'success');
      limpiarFormulario();
      await cargarSocios();
    }
  } catch (error) {
    mostrarFeedback('No se pudo conectar con el servidor. ¿Está el backend encendido?', 'error');
    mostrarMensaje('No se pudo conectar con el servidor. ¿Está el backend encendido?', 'error');
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
  limpiarFormulario();
});

window.eliminarSocio = async (id, nombreSocio = 'este socio') => {
  const deseaEliminar = confirm(`¿Estás seguro de que querés eliminar al socio "${nombreSocio}"?`);
  if (!deseaEliminar) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/socios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(data.message || 'No se pudo eliminar el socio.');
    }

    mostrarFeedback('Socio eliminado correctamente.', 'success');
    await cargarSocios();
  } catch (error) {
    mostrarFeedback(error.message || 'Error al intentar conectar con el servidor.', 'error');
  }
};

window.setEstado = async (id, estadoDeseado) => {
  try {
    const response = await fetch(`${API_URL}/socios/${id}/estado`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: estadoDeseado })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'No se pudo cambiar el estado');
    }

    mostrarFeedback(`Estado actualizado a ${estadoDeseado}.`, 'success');
    await cargarSocios();
  } catch (error) {
    mostrarFeedback(error.message || 'Error al cambiar el estado.', 'error');
  }
};

setAuthUi();
if (authToken) {
  cargarSocios();
}