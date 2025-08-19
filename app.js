// Estado global de la aplicación
let state = {
  items: [],
  searchTerm: '',
  isLoading: true,
  editingItemId: null,
  modalOpen: false
};

// Dominios comunes para autocompletado
const commonDomains = [
  '@gmail.com',
  '@live.com',
  '@hotmail.com',
  '@outlook.com',
  '@yahoo.com',
  '@icloud.com',
  '@protonmail.com',
  '@zoho.com'
];

// Paleta extendida de colores pastel (30 colores)
const pastelColors = [
  'card-color-1', 'card-color-2', 'card-color-3', 'card-color-4', 'card-color-5',
  'card-color-6', 'card-color-7', 'card-color-8', 'card-color-9', 'card-color-10',
  'card-color-11', 'card-color-12', 'card-color-13', 'card-color-14', 'card-color-15',
  'card-color-16', 'card-color-17', 'card-color-18', 'card-color-19', 'card-color-20',
  'card-color-21', 'card-color-22', 'card-color-23', 'card-color-24', 'card-color-25',
  'card-color-26', 'card-color-27', 'card-color-28', 'card-color-29', 'card-color-30'
];

// Elementos del DOM
const elements = {
  searchInput: null,
  accountsGrid: null,
  noResults: null,
  notification: null,
  fileInput: null,
  addAccountBtn: null,
  backupBtn: null,
  importBtn: null,
  detailModal: null,
  formModal: null
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  bindEvents();
  loadData();
});

// Inicializar referencias a elementos del DOM
function initializeElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.accountsGrid = document.getElementById('accountsGrid');
  elements.noResults = document.getElementById('noResults');
  elements.notification = document.getElementById('notification');
  elements.fileInput = document.getElementById('fileInput');
  elements.addAccountBtn = document.getElementById('addAccountBtn');
  elements.backupBtn = document.getElementById('backupBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.detailModal = document.getElementById('detailModal');
  elements.formModal = document.getElementById('formModal');
}

// Vincular eventos
function bindEvents() {
  elements.searchInput.addEventListener('input', handleSearch);
  elements.addAccountBtn.addEventListener('click', openAddModal);
  
  elements.backupBtn.addEventListener('click', () => {
    console.log('Backup button clicked');
    backupData();
  });
  
  elements.importBtn.addEventListener('click', () => {
    console.log('Import button clicked');
    const fileInput = document.getElementById('fileInput') || elements.fileInput;
    
    if (!fileInput) {
      const newFileInput = document.createElement('input');
      newFileInput.type = 'file';
      newFileInput.id = 'fileInput';
      newFileInput.accept = '.json';
      newFileInput.style.display = 'none';
      newFileInput.addEventListener('change', importData);
      document.body.appendChild(newFileInput);
      elements.fileInput = newFileInput;
      setTimeout(() => newFileInput.click(), 10);
    } else {
      fileInput.value = '';
      fileInput.click();
    }
  });
  
  elements.fileInput.addEventListener('change', importData);
  
  // Eventos del modal
  if (elements.detailModal) {
    document.getElementById('closeModal').addEventListener('click', closeDetailModal);
    elements.detailModal.addEventListener('click', (e) => {
      if (e.target === elements.detailModal) closeDetailModal();
    });
  }
  
  if (elements.formModal) {
    document.getElementById('closeFormModal').addEventListener('click', closeFormModal);
    document.getElementById('cancelForm').addEventListener('click', closeFormModal);
    document.getElementById('accountForm').addEventListener('submit', saveNewAccount);
    elements.formModal.addEventListener('click', (e) => {
      if (e.target === elements.formModal) closeFormModal();
    });
  }
}

// Cargar datos
async function loadData() {
  try {
    const localData = localStorage.getItem('gestorClaves');
    if (localData) {
      const parsedData = JSON.parse(localData);
      
      if (Array.isArray(parsedData)) {
        state.items = migrateToNewFormat(parsedData);
        saveStateToLocalStorage();
      } else if (parsedData.items) {
        state.items = parsedData.items;
      } else {
        state.items = [];
      }
      
      state.isLoading = false;
      render();
      return;
    }

    const response = await fetch('./data.json');
    if (response.ok) {
      const data = await response.json();
      state.items = data.items || [];
      saveStateToLocalStorage();
    } else {
      state.items = [];
    }
  } catch (error) {
    console.warn('No se pudo cargar data.json, iniciando con datos vacíos:', error);
    state.items = [];
  }

  state.isLoading = false;
  render();
}

// Migrar formato antiguo
function migrateToNewFormat(oldItems) {
  return oldItems.map(item => ({
    id: generateId(),
    descripcion: item.descripcion || item.nombre || 'Cuenta migrada',
    fields: [
      ...(item.correo ? [{ type: 'correo', value: item.correo }] : []),
      ...(item.clave ? [{ type: 'clave', value: item.clave }] : []),
      ...(item.enlace ? [{ type: 'enlace', value: item.enlace }] : [])
    ]
  }));
}

// Guardar estado
function saveStateToLocalStorage() {
  localStorage.setItem('gestorClaves', JSON.stringify({ items: state.items }));
}

// Renderizar interfaz
function render() {
  if (state.isLoading) {
    elements.accountsGrid.innerHTML = '<p>Cargando...</p>';
    return;
  }

  const filteredItems = filterItems();
  
  if (filteredItems.length === 0) {
    elements.accountsGrid.innerHTML = '';
    elements.noResults.style.display = 'block';
    return;
  }

  elements.noResults.style.display = 'none';
  elements.accountsGrid.innerHTML = filteredItems
    .map(item => createItemCard(item))
    .join('');

  bindCardEvents();
}

// Filtrar items
function filterItems() {
  if (!state.searchTerm) {
    return state.items;
  }

  const term = state.searchTerm.toLowerCase();
  return state.items.filter(item => {
    const searchableText = [
      item.descripcion,
      ...(item.fields || []).map(f => f.value)
    ].join(' ').toLowerCase();
    
    return searchableText.includes(term);
  });
}

// Crear tarjeta de item
function createItemCard(item) {
  const itemId = item.id || generateId();
  if (!item.id) {
    item.id = itemId;
  }

  // Asignar color aleatorio consistente
  const colorIndex = hashString(itemId) % pastelColors.length;
  const colorClass = pastelColors[colorIndex];

  const isHighlighted = state.searchTerm && 
    filterItems().some(filteredItem => filteredItem.id === itemId);

  const cardClasses = [
    'account-card',
    colorClass,
    isHighlighted ? 'highlight' : ''
  ].filter(Boolean).join(' ');

  // Obtener campos para mostrar
  const fieldsToShow = (item.fields || []).slice(0, 3);
  
  return `
    <div class="${cardClasses}" data-item-id="${itemId}" onclick="openDetailModal('${itemId}')">
      <div class="card-header">
        <div>
          <h3 class="card-title">${escapeHtml(item.descripcion || 'Sin descripción')}</h3>
          <span class="card-type type-correo">Cuenta</span>
        </div>
        <div class="card-actions" onclick="event.stopPropagation();">
          <button class="btn btn-icon" onclick="openEditModal('${itemId}')" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn btn-danger btn-icon" onclick="deleteItem('${itemId}')" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        ${fieldsToShow.map(field => createFieldPreview(field)).join('')}
        ${(item.fields || []).length > 3 ? '<div class="field-more">+ ' + ((item.fields || []).length - 3) + ' más...</div>' : ''}
      </div>
    </div>
  `;
}

// Crear preview de campo
function createFieldPreview(field) {
  const isSensitive = field.type === 'clave';
  const displayValue = isSensitive ? '••••••••' : field.value;
  const isLink = field.type === 'enlace' && field.value.startsWith('http');
  
  return `
    <div class="field-group">
      <label class="field-label">${getFieldLabel(field.type)}</label>
      <div class="field-value">
        <span class="field-text ${isLink ? 'is-link' : ''} ${isSensitive ? 'is-hidden' : ''}">
          ${escapeHtml(displayValue)}
        </span>
      </div>
    </div>
  `;
}

// Abrir modal de detalles
function openDetailModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');
  
  modalTitle.textContent = item.descripcion || 'Detalles de la Cuenta';
  
  modalBody.innerHTML = `
    <div class="modal-fields">
      ${(item.fields || []).map(field => createModalField(field)).join('')}
    </div>
  `;
  
  modalFooter.innerHTML = `
    <button class="btn btn-secondary" onclick="closeDetailModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="openEditModal('${itemId}'); closeDetailModal();">Editar</button>
  `;
  
  elements.detailModal.style.display = 'flex';
  state.modalOpen = true;
}

// Crear campo en modal
function createModalField(field) {
  const isSensitive = field.type === 'clave';
  const isLink = field.type === 'enlace' && field.value.startsWith('http');
  
  return `
    <div class="modal-field">
      <label class="modal-field-label">${getFieldLabel(field.type)}</label>
      <div class="modal-field-value">
        <span class="modal-field-text ${isLink ? 'is-link' : ''}" ${isLink ? `onclick="openLink('${field.value}')"` : ''}>
          ${escapeHtml(field.value)}
        </span>
        <div class="modal-field-actions">
          <button class="btn btn-icon" onclick="copyToClipboard('${escapeHtml(field.value)}')">📋</button>
          ${isSensitive ? `<button class="btn btn-icon" onclick="toggleModalFieldVisibility(this, '${escapeHtml(field.value)}')">👁️</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Cerrar modal de detalles
function closeDetailModal() {
  elements.detailModal.style.display = 'none';
  state.modalOpen = false;
}

// Abrir modal de añadir
function openAddModal() {
  openFormModal();
}

// Abrir modal de editar
function openEditModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  
  openFormModal(item);
}

// Abrir modal de formulario
function openFormModal(item = null) {
  const isEdit = !!item;
  const modalTitle = document.getElementById('formModalTitle');
  const form = document.getElementById('accountForm');
  const descInput = document.getElementById('formDescription');
  const dynamicFields = document.getElementById('dynamicFields');
  
  modalTitle.textContent = isEdit ? 'Editar Cuenta' : 'Nueva Cuenta';
  
  if (isEdit) {
    descInput.value = item.descripcion || '';
    form.dataset.editId = item.id;
    
    // Cargar campos existentes
    dynamicFields.innerHTML = (item.fields || []).map((field, index) => 
      createDynamicField(field.type, field.value, index)
    ).join('');
  } else {
    form.reset();
    delete form.dataset.editId;
    dynamicFields.innerHTML = '';
  }
  
  elements.formModal.style.display = 'flex';
  state.modalOpen = true;
}

// Cerrar modal de formulario
function closeFormModal() {
  elements.formModal.style.display = 'none';
  state.modalOpen = false;
}

// Añadir campo dinámico
function addField(type) {
  const dynamicFields = document.getElementById('dynamicFields');
  const index = dynamicFields.children.length;
  const fieldHtml = createDynamicField(type, '', index);
  dynamicFields.insertAdjacentHTML('beforeend', fieldHtml);
}

// Crear campo dinámico
function createDynamicField(type, value, index) {
  return `
    <div class="dynamic-field" data-type="${type}">
      <label class="field-label">${getFieldLabel(type)}</label>
      <div class="field-input-group">
        <input type="text" class="form-input" value="${escapeHtml(value)}" placeholder="${getFieldLabel(type)}">
        <button type="button" class="btn btn-icon btn-danger" onclick="removeField(this)" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Remover campo
function removeField(button) {
  button.closest('.dynamic-field').remove();
}

// Guardar nueva cuenta
function saveNewAccount(e) {
  e.preventDefault();
  
  const form = e.target;
  const isEdit = !!form.dataset.editId;
  const descInput = document.getElementById('formDescription');
  const dynamicFields = document.querySelectorAll('.dynamic-field');
  
  const newItem = {
    id: isEdit ? form.dataset.editId : generateId(),
    descripcion: descInput.value.trim(),
    fields: Array.from(dynamicFields).map(field => ({
      type: field.dataset.type,
      value: field.querySelector('.form-input').value.trim()
    })).filter(field => field.value)
  };
  
  if (!newItem.descripcion) {
    showNotification('❌ La descripción es obligatoria', 'error');
    return;
  }
  
  if (isEdit) {
    const index = state.items.findIndex(item => item.id === form.dataset.editId);
    if (index !== -1) {
      state.items[index] = newItem;
    }
  } else {
    state.items.push(newItem);
  }
  
  saveStateToLocalStorage();
  render();
  closeFormModal();
  
  showNotification(isEdit ? '✅ Cuenta actualizada' : '✅ Cuenta añadida');
}

// Eliminar item
function deleteItem(itemId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
    return;
  }
  
  state.items = state.items.filter(item => item.id !== itemId);
  saveStateToLocalStorage();
  render();
  showNotification('✅ Cuenta eliminada');
}

// Funciones de búsqueda
function handleSearch(e) {
  state.searchTerm = e.target.value;
  render();
}

// Funciones de utilidad
function generateId() {
  return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getFieldLabel(type) {
  const labels = {
    correo: 'Correo',
    clave: 'Contraseña',
    name: 'Nombre',
    enlace: 'Enlace'
  };
  return labels[type] || type;
}

// Funciones de acciones
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('✅ Copiado al portapapeles');
  }).catch(() => {
    showNotification('❌ Error al copiar', 'error');
  });
}

function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function toggleModalFieldVisibility(button, realValue) {
  const textSpan = button.parentElement.previousElementSibling;
  const isHidden = textSpan.textContent.includes('••••');
  
  if (isHidden) {
    textSpan.textContent = realValue;
    button.textContent = '🙈';
  } else {
    textSpan.textContent = '••••••••';
    button.textContent = '👁️';
  }
}

// Funciones de backup/import
function backupData() {
  try {
    const dataToExport = {
      items: state.items,
      timestamp: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestor-claves-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Backup creado exitosamente');
  } catch (error) {
    console.error('Error creating backup:', error);
    showNotification('❌ Error al crear el backup', 'error');
  }
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      
      if (data.items && Array.isArray(data.items)) {
        state.items = data.items;
        saveStateToLocalStorage();
        render();
        showNotification('✅ Datos importados exitosamente');
      } else {
        showNotification('❌ Formato de archivo inválido', 'error');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('❌ Error al importar los datos', 'error');
    }
  };
  
  reader.readAsText(file);
}

// Mostrar notificación
function showNotification(message, type = 'success') {
  if (!elements.notification) return;
  
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type}`;
  
  // Mostrar notificación
  setTimeout(() => {
    elements.notification.classList.add('show');
  }, 100);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    elements.notification.classList.remove('show');
  }, 3000);
}

// Vincular eventos de tarjetas
function bindCardEvents() {
  // Los eventos se manejan mediante onclick inline para mejor rendimiento
  console.log('Cards rendered and events bound');
}

// Manejar tecla ESC para cerrar modales
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.modalOpen) {
    if (elements.detailModal.style.display === 'flex') {
      closeDetailModal();
    }
    if (elements.formModal.style.display === 'flex') {
      closeFormModal();
    }
  }
});