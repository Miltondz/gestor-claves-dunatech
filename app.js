"use strict";

const STORAGE_KEY = 'gestorClaves';
const RECOVERY_PREFIX = 'gestorClaves.recovery.';
const SCHEMA_VERSION = '2.0';
const DEBOUNCE_MS = 150;
const UNDO_MS = 5000;
const MAX_DESC_LENGTH = 200;
const MAX_FIELD_VALUE_LENGTH = 2000;
const MAX_ID_LENGTH = 64;
const VALID_FIELD_TYPES = new Set(['correo', 'clave', 'name', 'enlace']);
const SAFE_URL_RE = /^(https?:|mailto:|tel:)/i;
const SCHEME_RE = /^[a-z]+:/i;
const PASTEL_COLORS = ['pastel-blue', 'pastel-purple', 'pastel-green', 'pastel-yellow', 'pastel-pink'];
const CATEGORY_ICONS = {
  Personal: 'person',
  Trabajo: 'work',
  Finanzas: 'payments',
  Social: 'groups',
  Otro: 'key'
};
const CATEGORIES = ['Personal', 'Trabajo', 'Finanzas', 'Social', 'Otro'];
const FIELD_LABELS = {
  correo: 'Correo',
  clave: 'Contraseña',
  name: 'Nombre',
  enlace: 'Enlace'
};
const SORT_OPTIONS = {
  'name-asc': 'name',
  'name-desc': 'name',
  'date-newest': 'createdAt',
  'date-oldest': 'createdAt'
};

const state = {
  items: [],
  searchTerm: '',
  filterCategory: 'all',
  sortBy: 'name-asc',
  isLoading: true,
  modalOpen: false,
  searchTimer: null,
  notificationTimer: null,
  undoTimer: null
};

const elements = {
  searchInput: null,
  searchClear: null,
  searchCounter: null,
  searchInputMobile: null,
  searchClearMobile: null,
  accountsGrid: null,
  noResults: null,
  noResultsTitle: null,
  noResultsText: null,
  addFirstBtn: null,
  notification: null,
  fileInput: null,
  addAccountBtn: null,
  backupBtn: null,
  importBtn: null,
  detailModal: null,
  formModal: null,
  undoToast: null
};

document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  bindEvents();
  wireCategoryNav();
  loadData();
  registerServiceWorker();
});

function initializeElements() {
  const refs = [
    ['searchInput', 'searchInput'],
    ['searchClear', 'searchClear'],
    ['searchCounter', 'searchCounter'],
    ['searchInputMobile', 'searchInputMobile'],
    ['searchClearMobile', 'searchClearMobile'],
    ['accountsGrid', 'accountsGrid'],
    ['noResults', 'noResults'],
    ['noResultsTitle', 'noResultsTitle'],
    ['noResultsText', 'noResultsText'],
    ['addFirstBtn', 'addFirstBtn'],
    ['notification', 'notification'],
    ['fileInput', 'fileInput'],
    ['addAccountBtn', 'addAccountBtn'],
    ['backupBtn', 'backupBtn'],
    ['importBtn', 'importBtn'],
    ['detailModal', 'detailModal'],
    ['formModal', 'formModal'],
    ['undoToast', 'undoToast']
  ];
  for (const [key, id] of refs) {
    elements[key] = document.getElementById(id);
  }
}

function bindEvents() {
  elements.searchInput.addEventListener('input', handleSearchInput);
  elements.searchInput.addEventListener('keydown', handleSearchKeydown);
  elements.searchClear.addEventListener('click', clearSearch);
  if (elements.searchInputMobile) {
    elements.searchInputMobile.addEventListener('input', handleSearchInput);
    elements.searchInputMobile.addEventListener('keydown', handleSearchKeydown);
  }
  if (elements.searchClearMobile) {
    elements.searchClearMobile.addEventListener('click', clearSearch);
  }
  if (elements.addFirstBtn) elements.addFirstBtn.addEventListener('click', openAddModal);

  elements.addAccountBtn.addEventListener('click', openAddModal);
  elements.backupBtn.addEventListener('click', backupData);
  elements.importBtn.addEventListener('click', triggerImport);
  elements.fileInput.addEventListener('change', importData);

  document.getElementById('sidebarAddBtn')?.addEventListener('click', openAddModal);
  document.getElementById('sidebarBackupBtn')?.addEventListener('click', backupData);
  document.getElementById('sidebarImportBtn')?.addEventListener('click', triggerImport);
  document.getElementById('bottomAddBtn')?.addEventListener('click', openAddModal);
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  elements.accountsGrid.addEventListener('click', handleGridClick);
  elements.accountsGrid.addEventListener('keydown', handleGridKeydown);

  document.getElementById('closeModal').addEventListener('click', closeDetailModal);
  document.getElementById('closeFormModal').addEventListener('click', closeFormModal);
  document.getElementById('cancelForm').addEventListener('click', closeFormModal);
  document.getElementById('saveForm').addEventListener('click', () => {
    document.getElementById('accountForm').dispatchEvent(new Event('submit', { cancelable: true }));
  });
  document.getElementById('accountForm').addEventListener('submit', saveNewAccount);
  document.querySelectorAll('[data-add-field]').forEach(btn => {
    btn.addEventListener('click', () => addField(btn.dataset.addField));
  });

  elements.detailModal.addEventListener('click', handleDetailClick);
  elements.formModal.addEventListener('click', handleFormClick);
  elements.formModal.addEventListener('click', e => {
    if (e.target === elements.formModal) closeFormModal();
  });

  document.addEventListener('keydown', handleGlobalKeydown);

  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sortBy = e.target.value;
    render();
  });
}

function wireCategoryNav() {
  const handleCategoryClick = (e) => {
    const el = e.currentTarget;
    state.filterCategory = el.dataset.category;
    updateCategoryActive(state.filterCategory);
    render();
  };

  document.querySelectorAll('[data-category]').forEach(el => {
    el.addEventListener('click', handleCategoryClick);
  });

  updateCategoryActive('all');
}

function updateCategoryActive(category) {
  document.querySelectorAll('[data-category]').forEach(el => {
    const isActive = el.dataset.category === category;

    if (el.classList.contains('nav-link')) {
      el.classList.toggle('bg-secondary-container', isActive);
      el.classList.toggle('font-bold', isActive);
      el.classList.toggle('text-text-primary', isActive);
      el.classList.toggle('text-text-secondary', !isActive);
    }
    if (el.classList.contains('filter-chip')) {
      el.classList.toggle('bg-primary-container', isActive);
      el.classList.toggle('text-on-primary-container', isActive);
      el.classList.toggle('bg-surface-container-high', !isActive);
      el.classList.toggle('text-text-secondary', !isActive);
    }
    if (el.classList.contains('bottom-nav-btn')) {
      el.classList.toggle('text-primary', isActive);
      el.classList.toggle('text-text-secondary', !isActive);
      const icon = el.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.setProperty('font-variation-settings', `'FILL' ${isActive ? 1 : 0}`, 'important');
      }
    }
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  navigator.serviceWorker.register('./sw.js').catch(err => {
    console.warn('Service worker registration failed:', err);
  });
}

function triggerImport() {
  elements.fileInput.value = '';
  elements.fileInput.click();
}

async function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let parsed = null;
  let parseError = null;

  if (raw !== null) {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parseError = err;
    }
  }

  if (parseError) {
    const recoveryKey = RECOVERY_PREFIX + Date.now();
    try {
      localStorage.setItem(recoveryKey, raw);
      console.warn(`JSON corrupto guardado en ${recoveryKey}:`, parseError);
    } catch (e) {
      console.error('No se pudo respaldar el JSON corrupto:', e);
    }
    state.items = [];
    showNotification('❌ Datos locales corruptos. Iniciando vacío.', 'error', 6000);
  } else if (Array.isArray(parsed)) {
    const migrated = migrateToNewFormat(parsed).filter(Boolean);
    state.items = migrated;
    saveStateToLocalStorage();
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
    const validated = parsed.items.map(validateItem).filter(Boolean);
    state.items = validated;
  } else {
    state.items = [];
  }

  if (raw === null) {
    try {
      const response = await fetch('./data.json');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          const validated = data.items.map(validateItem).filter(Boolean);
          if (validated.length > 0) {
            state.items = validated;
            saveStateToLocalStorage();
          }
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar data.json:', err);
    }
  }

  state.isLoading = false;
  render();
}

function migrateToNewFormat(oldItems) {
  return oldItems
    .filter(item => item && typeof item === 'object')
    .map(validateItem);
}

function saveStateToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: state.items,
      version: SCHEMA_VERSION
    }));
    return true;
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      showNotification('❌ Almacenamiento lleno. Exporta un backup y borra cuentas viejas.', 'error', 8000);
    } else {
      showNotification('❌ No se pudo guardar: ' + (err && err.message ? err.message : 'error desconocido'), 'error');
    }
    return false;
  }
}

function render() {
  if (state.isLoading) {
    elements.accountsGrid.innerHTML = '<div class="col-span-full text-center py-16 text-text-secondary"><span class="material-symbols-outlined text-4xl block mb-3">sync</span><span class="text-sm">Cargando...</span></div>';
    elements.noResults.style.display = 'none';
    updateSearchUI(0);
    return;
  }

  const filteredItems = filterItems();
  const sortedItems = sortItems(filteredItems);
  const filteredIds = new Set(sortedItems.map(i => i.id));

  if (state.items.length === 0) {
    elements.accountsGrid.innerHTML = createAddNewCard();
    elements.noResults.style.display = 'none';
    updateSearchUI(0);
    return;
  }

  if (sortedItems.length === 0) {
    elements.accountsGrid.innerHTML = '';
    elements.noResults.style.display = 'flex';
    elements.noResultsTitle.textContent = 'Sin resultados';
    elements.noResultsText.textContent = state.searchTerm
      ? 'No hay cuentas que coincidan con tu búsqueda.'
      : 'No hay cuentas en esta categoría.';
    if (elements.addFirstBtn) elements.addFirstBtn.classList.add('hidden');
    updateSearchUI(0);
    return;
  }

  elements.noResults.style.display = 'none';
  elements.accountsGrid.innerHTML = sortedItems
    .map(item => createItemCard(item, state.searchTerm, filteredIds))
    .join('') + createAddNewCard();
  updateSearchUI(sortedItems.length);
}

function filterItems() {
  let items = state.items;
  if (state.filterCategory !== 'all') {
    items = items.filter(item => item.category === state.filterCategory);
  }
  if (!state.searchTerm) return items;
  const term = state.searchTerm.toLowerCase();
  return items.filter(item => {
    const parts = [item.descripcion || ''];
    if (Array.isArray(item.fields)) {
      for (const f of item.fields) parts.push(f.value || '');
    }
    return parts.join(' ').toLowerCase().includes(term);
  });
}

function sortItems(items) {
  const sorted = [...items];
  const dir = state.sortBy.endsWith('-desc') ? -1 : 1;
  const field = SORT_OPTIONS[state.sortBy] || 'name';
  sorted.sort((a, b) => {
    let valA, valB;
    if (field === 'name') {
      valA = (a.descripcion || '').toLowerCase();
      valB = (b.descripcion || '').toLowerCase();
      return valA.localeCompare(valB) * dir;
    }
    valA = a.createdAt || 0;
    valB = b.createdAt || 0;
    return (valA - valB) * dir;
  });
  return sorted;
}

function updateSearchUI(shownCount) {
  const total = state.items.length;
  const hasTerm = elements.searchInput && elements.searchInput.value.length > 0;

  [elements.searchClear, elements.searchClearMobile].forEach(btn => {
    if (btn) btn.classList.toggle('hidden', !hasTerm);
  });

  if (elements.searchCounter) {
    if (total === 0) {
      elements.searchCounter.textContent = '0 cuentas';
    } else {
      elements.searchCounter.textContent = hasTerm
        ? `${shownCount} de ${total}`
        : `${total} ${total === 1 ? 'cuenta' : 'cuentas'}`;
    }
  }
}

function clearSearch() {
  const empty = '';
  elements.searchInput.value = empty;
  if (elements.searchInputMobile) elements.searchInputMobile.value = empty;
  state.searchTerm = empty;
  render();
  if (elements.searchInput.offsetParent !== null) {
    elements.searchInput.focus();
  } else if (elements.searchInputMobile) {
    elements.searchInputMobile.focus();
  }
}

function flashCopied(button) {
  if (!button) return;
  const icon = button.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = 'check';
  button.classList.add('copied');
  setTimeout(() => {
    if (icon) icon.textContent = 'content_copy';
    button.classList.remove('copied');
  }, 1100);
}

function highlightMatches(text, term) {
  if (!text) return '';
  if (!term) return escapeHtml(text);
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safeTerm, 'gi');
  let result = '';
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, m.index));
    result += '<mark>' + escapeHtml(m[0]) + '</mark>';
    lastIndex = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  result += escapeHtml(text.slice(lastIndex));
  return result;
}

function createItemCard(item, searchTerm, filteredIds) {
  const itemId = item.id || generateId();
  if (!item.id) item.id = itemId;

  const colorIdx = hashString(itemId) % PASTEL_COLORS.length;
  const accentColor = PASTEL_COLORS[colorIdx];
  const category = item.category && CATEGORIES.includes(item.category) ? item.category : 'Personal';
  const iconName = CATEGORY_ICONS[category] || 'key';
  const safeId = escapeHtml(itemId);
  const safeDesc = escapeHtml(item.descripcion || 'Sin descripción');
  const ariaDesc = escapeHtml(item.descripcion || 'cuenta sin descripción');
  const safeCategory = escapeHtml(category);
  const accentBorder = `group-hover:border-${accentColor}/30`;
  const iconBg = `bg-${accentColor}/20`;
  const iconText = `text-${accentColor}`;

  const fields = Array.isArray(item.fields) ? item.fields : [];
  const fieldsToShow = fields.slice(0, 3);
  const moreCount = fields.length - fieldsToShow.length;

  const fieldsHtml = fieldsToShow.map(f => createFieldPreview(f, searchTerm, accentColor)).join('');

  return `
    <div class="textured-card rounded-xl p-card-padding bg-${accentColor}/10 border border-${accentColor}/20 group" data-item-id="${safeId}" role="button" tabindex="0" aria-label="Ver detalles de ${ariaDesc}">
      <div class="absolute top-0 left-0 w-full h-1 bg-${accentColor}"></div>
      <div class="flex justify-between items-start mb-5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconText} shrink-0">
            <span class="material-symbols-outlined text-xl" aria-hidden="true">${iconName}</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-headline-md text-sm md:text-base leading-tight text-text-primary truncate">${safeDesc}</h3>
            <span class="inline-block text-[10px] font-bold uppercase tracking-widest ${iconBg} ${iconText} px-2 py-0.5 rounded-full mt-1">${safeCategory}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0 ml-2" data-card-actions>
          <button class="p-1.5 text-text-secondary hover:${iconText} transition-colors rounded" data-action="edit" data-id="${safeId}" title="Editar" aria-label="Editar ${safeDesc}">
            <span class="material-symbols-outlined text-base" aria-hidden="true">edit</span>
          </button>
          <button class="p-1.5 text-text-secondary hover:${iconText} transition-colors rounded" data-action="duplicate" data-id="${safeId}" title="Duplicar" aria-label="Duplicar ${safeDesc}">
            <span class="material-symbols-outlined text-base" aria-hidden="true">content_copy</span>
          </button>
          <button class="p-1.5 text-text-secondary hover:text-error transition-colors rounded" data-action="delete" data-id="${safeId}" title="Eliminar" aria-label="Eliminar ${safeDesc}">
            <span class="material-symbols-outlined text-base" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>
      <div class="space-y-3">
        ${fieldsHtml}
        ${moreCount > 0 ? `<div class="text-center pt-1"><span class="text-[11px] text-text-secondary italic">+ ${moreCount} más...</span></div>` : ''}
      </div>
    </div>
  `;
}

function createFieldPreview(field, searchTerm, accentColor) {
  const isSensitive = field.type === 'clave';
  const displayValue = isSensitive ? '••••••••' : (field.value || '');
  const clickable = isClickableLink(field);
  const safeValue = escapeHtml(field.value || '');
  const safeLabel = escapeHtml(getFieldLabel(field.type));
  const highlighted = highlightMatches(displayValue, searchTerm);

  let valueContent = `<span class="text-xs md:text-sm text-text-primary truncate${isSensitive ? ' font-mono-data tracking-widest' : ''}${clickable ? ' text-pastel-blue hover:underline cursor-pointer' : ''}">${isSensitive ? '••••••••' : highlighted}</span>`;

  if (clickable) {
    valueContent = `<span class="text-xs md:text-sm text-pastel-blue hover:underline cursor-pointer" data-action="open-link" data-type="${escapeHtml(field.type)}" data-value="${safeValue}" role="link" tabindex="0">${isSensitive ? '••••••••' : highlighted}</span>`;
  }

  return `
    <div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">${safeLabel}</p>
      <div class="flex items-center justify-between bg-surface/50 p-2.5 rounded-lg border border-border group-hover:border-${accentColor}/30 transition-all min-w-0">
        ${valueContent}
        <button class="field-copy text-text-secondary hover:${accentColor === 'pastel-pink' || accentColor === 'pastel-purple' ? 'text-primary-container' : 'text-' + accentColor} transition-colors shrink-0 ml-2 p-1 rounded" data-action="copy" data-value="${safeValue}" data-label="${safeLabel}" title="Copiar ${safeLabel}" aria-label="Copiar ${safeLabel}">
          <span class="material-symbols-outlined text-base" aria-hidden="true">content_copy</span>
        </button>
      </div>
    </div>
  `;
}

function createAddNewCard() {
  return `
    <button type="button" data-action="open-add" class="border-2 border-dashed border-border rounded-xl p-card-padding flex flex-col items-center justify-center text-text-secondary hover:border-primary-container hover:text-primary-container transition-all group w-full min-h-[220px] cursor-pointer">
      <div class="w-12 h-12 rounded-full border-2 border-dashed border-text-secondary group-hover:border-primary-container flex items-center justify-center mb-4 transition-all">
        <span class="material-symbols-outlined text-3xl" aria-hidden="true">add</span>
      </div>
      <span class="font-headline-md text-headline-md text-center">Crear Nueva Entrada</span>
      <span class="text-xs mt-2 opacity-60 text-center">Añade credenciales, contraseñas o enlaces</span>
    </button>
  `;
}

function openDetailModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  const prevFocus = document.activeElement;

  const category = item.category && CATEGORIES.includes(item.category) ? item.category : 'Personal';
  const iconName = CATEGORY_ICONS[category] || 'key';
  const titleEl = document.getElementById('modalTitle');
  titleEl.innerHTML = '';
  titleEl.appendChild(document.createTextNode(item.descripcion || 'Detalles de la Cuenta'));

  document.getElementById('modalBody').innerHTML = `
    <div class="space-y-3">
      ${(item.fields || []).map(createModalField).join('')}
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="px-4 py-2 rounded-lg bg-surface-container-high text-text-secondary text-sm font-bold hover:text-text-primary hover:bg-surface-container-highest transition-all" data-action="close-detail">Cerrar</button>
    <button class="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:opacity-90 active:scale-95 transition-all" data-action="edit-from-detail" data-id="${escapeHtml(itemId)}">Editar</button>
  `;

  showModal(elements.detailModal, prevFocus);
}

function createModalField(field) {
  const isSensitive = field.type === 'clave';
  const clickable = isClickableLink(field);
  const safeValue = escapeHtml(field.value || '');
  const safeLabel = escapeHtml(getFieldLabel(field.type));

  return `
    <div class="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3 border border-white/5">
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">${safeLabel}</p>
        <span class="modal-field-text text-text-primary text-sm break-all${clickable ? ' cursor-pointer hover:text-pastel-blue hover:underline' : ''}"${clickable ? ` data-action="open-link" data-type="${escapeHtml(field.type)}" data-value="${safeValue}" role="link" tabindex="0"` : ''}>${safeValue}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0 ml-3">
        <button class="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg" data-action="copy" data-value="${safeValue}" data-label="${safeLabel}" title="Copiar ${safeLabel}" aria-label="Copiar ${safeLabel}">
          <span class="material-symbols-outlined text-base" aria-hidden="true">content_copy</span>
        </button>
        ${isSensitive ? `<button class="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg" data-action="toggle" data-value="${safeValue}" data-hidden="true" title="Mostrar u ocultar" aria-label="Mostrar u ocultar ${safeLabel}">
          <span class="material-symbols-outlined text-base" aria-hidden="true">visibility</span>
        </button>` : ''}
      </div>
    </div>
  `;
}

function closeDetailModal() {
  hideModal(elements.detailModal);
}

function openAddModal() {
  openFormModal();
}

function openEditModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  openFormModal(item);
}

function openFormModal(item = null) {
  const isEdit = !!item;
  const form = document.getElementById('accountForm');
  const descInput = document.getElementById('formDescription');
  const catSelect = document.getElementById('formCategory');
  const dynamicFields = document.getElementById('dynamicFields');
  const prevFocus = document.activeElement;

  document.getElementById('formModalTitle').textContent = isEdit ? 'Editar Entrada' : 'Nueva Entrada';
  form.reset();
  delete form.dataset.editId;
  dynamicFields.innerHTML = '';

  if (isEdit) {
    descInput.value = item.descripcion || '';
    catSelect.value = CATEGORIES.includes(item.category) ? item.category : 'Personal';
    form.dataset.editId = item.id;
    if (Array.isArray(item.fields)) {
      dynamicFields.innerHTML = item.fields.map(f => createDynamicField(f.type, f.value)).join('');
    }
  } else {
    catSelect.value = 'Personal';
    dynamicFields.innerHTML = createDynamicField('correo', '') + createDynamicField('clave', '');
  }

  showModal(elements.formModal, prevFocus);
  setTimeout(() => descInput.focus(), 50);
}

function closeFormModal() {
  hideModal(elements.formModal);
}

function showModal(modal, prevFocus) {
  modal._prevFocus = prevFocus instanceof HTMLElement ? prevFocus : null;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  state.modalOpen = true;
}

function hideModal(modal) {
  modal.classList.add('hidden');
  modal.style.display = 'none';
  state.modalOpen = false;
  const prev = modal._prevFocus;
  modal._prevFocus = null;
  if (prev && document.body.contains(prev) && typeof prev.focus === 'function') {
    prev.focus();
  }
}

function addField(type) {
  if (!VALID_FIELD_TYPES.has(type)) return;
  document.getElementById('dynamicFields').insertAdjacentHTML('beforeend', createDynamicField(type, ''));
}

function createDynamicField(type, value) {
  const safeValue = escapeHtml(value);
  const safeType = escapeHtml(type);
  const safeLabel = escapeHtml(getFieldLabel(type));

  return `
    <div class="dynamic-field flex gap-3 items-start" data-type="${safeType}">
      <div class="flex-1 min-w-0">
        <label class="block text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 ml-1">${safeLabel}</label>
        <input type="text" class="form-input w-full bg-surface-container-low border border-white/5 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary-container focus:border-transparent focus:outline-none transition-all" value="${safeValue}" placeholder="${safeLabel}" maxlength="${MAX_FIELD_VALUE_LENGTH}">
      </div>
      <button type="button" class="mt-6 p-2 text-error/60 hover:text-error hover:bg-error/10 rounded-lg transition-all" data-action="remove-field" aria-label="Eliminar campo">
        <span class="material-symbols-outlined text-base" aria-hidden="true">delete</span>
      </button>
    </div>
  `;
}

function saveNewAccount(e) {
  e.preventDefault();
  const form = document.getElementById('accountForm');
  const isEdit = !!form.dataset.editId;
  const descInput = document.getElementById('formDescription');
  const catSelect = document.getElementById('formCategory');
  const dynamicFields = document.querySelectorAll('.dynamic-field');

  const descripcion = (descInput.value || '').trim().slice(0, MAX_DESC_LENGTH);
  if (!descripcion) {
    showNotification('❌ La descripción es obligatoria', 'error');
    descInput.focus();
    return;
  }

  const category = CATEGORIES.includes(catSelect.value) ? catSelect.value : 'Personal';
  const fields = [];
  for (const field of dynamicFields) {
    const type = field.dataset.type;
    if (!VALID_FIELD_TYPES.has(type)) continue;
    const value = (field.querySelector('.form-input').value || '').trim().slice(0, MAX_FIELD_VALUE_LENGTH);
    if (value) fields.push({ type, value });
  }

  const existing = isEdit ? state.items.find(i => i.id === form.dataset.editId) : null;
  const newItem = {
    id: isEdit ? form.dataset.editId : generateId(),
    descripcion,
    category,
    fields,
    createdAt: existing ? existing.createdAt : Date.now()
  };

  if (isEdit) {
    const index = state.items.findIndex(item => item.id === form.dataset.editId);
    if (index !== -1) state.items[index] = newItem;
  } else {
    state.items.push(newItem);
  }

  if (saveStateToLocalStorage()) {
    closeFormModal();
    render();
    showNotification(isEdit ? '✅ Cuenta actualizada' : '✅ Cuenta añadida');
  }
}

function deleteItem(itemId) {
  const index = state.items.findIndex(i => i.id === itemId);
  if (index === -1) return;
  const removed = state.items[index];

  state.items.splice(index, 1);
  saveStateToLocalStorage();
  render();

  showUndo(`Cuenta "${removed.descripcion || 'sin nombre'}" eliminada`, () => {
    if (!state.items.some(i => i.id === removed.id)) {
      state.items.splice(Math.min(index, state.items.length), 0, removed);
      saveStateToLocalStorage();
      render();
    }
  });
}

function duplicateItem(itemId) {
  const index = state.items.findIndex(i => i.id === itemId);
  if (index === -1) return;
  const original = state.items[index];
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = generateId();
  copy.descripcion = ((original.descripcion || 'Sin descripción') + ' (copia)').slice(0, MAX_DESC_LENGTH);
  state.items.push(copy);
  if (saveStateToLocalStorage()) {
    render();
    showNotification('✅ Cuenta duplicada');
  }
}

function handleSearchInput(e) {
  const source = e.target;
  const value = source.value;

  if (source !== elements.searchInput) elements.searchInput.value = value;
  if (elements.searchInputMobile && source !== elements.searchInputMobile) elements.searchInputMobile.value = value;

  const shown = state.items.reduce((acc, item) => {
    if (state.filterCategory !== 'all') {
      if (item.category !== state.filterCategory) return acc;
    }
    if (!value) return acc + 1;
    const term = value.toLowerCase();
    const parts = [item.descripcion || ''];
    if (Array.isArray(item.fields)) {
      for (const f of item.fields) parts.push(f.value || '');
    }
    return parts.join(' ').toLowerCase().includes(term) ? acc + 1 : acc;
  }, 0);

  [elements.searchClear, elements.searchClearMobile].forEach(btn => {
    if (btn) btn.classList.toggle('hidden', value.length === 0);
  });
  if (elements.searchCounter) {
    elements.searchCounter.textContent = value
      ? `${shown} de ${state.items.length}`
      : `${state.items.length} ${state.items.length === 1 ? 'cuenta' : 'cuentas'}`;
  }

  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => {
    state.searchTerm = value;
    render();
  }, DEBOUNCE_MS);
}

function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    clearSearch();
  }
}

function handleGridClick(e) {
  const action = e.target.closest('[data-action]');
  if (action && elements.accountsGrid.contains(action)) {
    const id = action.dataset.id;
    switch (action.dataset.action) {
      case 'edit': openEditModal(id); return;
      case 'duplicate': duplicateItem(id); return;
      case 'delete': deleteItem(id); return;
      case 'copy':
        copyToClipboard(action.dataset.value, action);
        return;
      case 'open-add': openAddModal(); return;
      case 'open-link':
        if (action.dataset.type && action.dataset.value) {
          openLink({ type: action.dataset.type, value: action.dataset.value });
        }
        return;
    }
  }
  const card = e.target.closest('.textured-card');
  if (card && elements.accountsGrid.contains(card)) {
    const actionsContainer = e.target.closest('[data-card-actions]');
    if (actionsContainer) return;
    openDetailModal(card.dataset.itemId);
  }
}

function handleGridKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const action = e.target.closest('[data-action]');
  if (action) return;
  const card = e.target.closest('.textured-card');
  if (card && elements.accountsGrid.contains(card)) {
    e.preventDefault();
    openDetailModal(card.dataset.itemId);
  }
}

function handleDetailClick(e) {
  if (e.target === elements.detailModal) {
    closeDetailModal();
    return;
  }
  const action = e.target.closest('[data-action]');
  if (!action) return;
  switch (action.dataset.action) {
    case 'open-link':
      openLink({ type: action.dataset.type, value: action.dataset.value });
      break;
    case 'copy':
      copyToClipboard(action.dataset.value, action);
      break;
    case 'toggle':
      toggleModalFieldVisibility(action, action.dataset.value);
      break;
    case 'close-detail':
      closeDetailModal();
      break;
    case 'edit-from-detail':
      closeDetailModal();
      openEditModal(action.dataset.id);
      break;
  }
}

function handleFormClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  if (action.dataset.action === 'remove-field') {
    action.closest('.dynamic-field').remove();
  }
}

function handleGlobalKeydown(e) {
  const inForm = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');

  if (e.key === 'Escape') {
    if (state.modalOpen) {
      const detail = elements.detailModal;
      const form = elements.formModal;
      if (!detail.classList.contains('hidden') || detail.style.display === 'flex') closeDetailModal();
      else if (!form.classList.contains('hidden') || form.style.display === 'flex') closeFormModal();
      return;
    }
    if (inForm && e.target === elements.searchInput && state.searchTerm) {
      clearSearch();
    }
    return;
  }

  if (state.modalOpen) return;

  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    elements.searchInput.focus();
    elements.searchInput.select();
    return;
  }

  if (e.key === '/' && !inForm) {
    e.preventDefault();
    elements.searchInput.focus();
    elements.searchInput.select();
  }
}

function generateId() {
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 11);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function getFieldLabel(type) {
  return FIELD_LABELS[type] || type;
}

function isClickableLink(field) {
  if (!field || !field.value) return false;
  if (field.type === 'correo') return true;
  if (field.type === 'enlace') {
    const v = field.value.trim();
    if (SAFE_URL_RE.test(v)) return true;
    if (!SCHEME_RE.test(v)) return true;
  }
  return false;
}

function normalizeUrl(field) {
  const v = (field.value || '').trim();
  if (field.type === 'correo') {
    if (SCHEME_RE.test(v)) return v;
    return 'mailto:' + v;
  }
  if (SAFE_URL_RE.test(v)) return v;
  return 'https://' + v;
}

function copyToClipboard(text, button) {
  if (text == null || text === '') return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    showNotification('❌ Portapapeles no disponible. Usa HTTPS o localhost.', 'error');
    return;
  }
  const label = button && button.dataset && button.dataset.label ? button.dataset.label : '';
  navigator.clipboard.writeText(text).then(
    () => {
      flashCopied(button);
      if (!button || !button.closest('.textured-card')) {
        showNotification(label ? `✅ ${label} copiado` : '✅ Copiado al portapapeles');
      }
    },
    () => showNotification('❌ Error al copiar', 'error')
  );
}

function openLink(field) {
  const url = normalizeUrl(field);
  if (!SAFE_URL_RE.test(url)) {
    showNotification('❌ Enlace no permitido', 'error');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function toggleModalFieldVisibility(button, realValue) {
  const container = button.closest('.flex');
  if (!container) return;
  const textSpan = container.querySelector('.modal-field-text');
  if (!textSpan) return;
  const icon = button.querySelector('.material-symbols-outlined');
  const isHidden = button.dataset.hidden === 'true';
  if (isHidden) {
    textSpan.textContent = realValue;
    if (icon) icon.textContent = 'visibility_off';
    button.dataset.hidden = 'false';
  } else {
    textSpan.textContent = '••••••••';
    if (icon) icon.textContent = 'visibility';
    button.dataset.hidden = 'true';
  }
}

function backupData() {
  try {
    const payload = {
      items: state.items,
      timestamp: new Date().toISOString(),
      version: SCHEMA_VERSION
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultly-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      const raw = JSON.parse(event.target.result);
      const items = validateImport(raw);
      state.items = items;
      if (saveStateToLocalStorage()) {
        render();
        showNotification(`✅ ${items.length} cuenta(s) importada(s)`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('❌ ' + (error.message || 'Archivo inválido'), 'error');
    }
  };
  reader.readAsText(file);
}

function validateImport(data) {
  if (!data || typeof data !== 'object') throw new Error('Formato de archivo inválido');
  if (!Array.isArray(data.items)) throw new Error('Falta el array "items"');
  const out = [];
  for (const raw of data.items) {
    const item = validateItem(raw);
    if (item) out.push(item);
  }
  if (out.length === 0) throw new Error('Ningún item válido en el archivo');
  return out;
}

function validateItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const descripcion = String(raw.descripcion || '').trim().slice(0, MAX_DESC_LENGTH);
  if (!descripcion) return null;
  const id = typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= MAX_ID_LENGTH
    ? raw.id
    : generateId();
  const category = CATEGORIES.includes(raw.category) ? raw.category : 'Personal';
  const createdAt = typeof raw.createdAt === 'number' && raw.createdAt > 0 ? raw.createdAt : Date.now();
  const fields = [];
  if (Array.isArray(raw.fields)) {
    for (const f of raw.fields) {
      if (!f || typeof f !== 'object') continue;
      if (!VALID_FIELD_TYPES.has(f.type)) continue;
      const value = String(f.value == null ? '' : f.value).slice(0, MAX_FIELD_VALUE_LENGTH);
      if (!value) continue;
      fields.push({ type: f.type, value });
    }
  }
  return { id, descripcion, category, fields, createdAt };
}

function showNotification(message, type = 'success', duration = 3000) {
  const el = elements.notification;
  if (!el) return;
  clearTimeout(state.notificationTimer);
  el.textContent = message;
  el.className = 'notification fixed top-4 right-4 px-5 py-3 rounded-lg font-medium text-sm shadow-2xl z-[60] transition-all duration-300 pointer-events-auto';
  if (type === 'error') {
    el.classList.add('bg-error', 'text-on-error');
  } else {
    el.classList.add('bg-tertiary', 'text-black');
  }
  el.classList.remove('opacity-0', 'translate-x-96');
  el.classList.add('opacity-100', 'translate-x-0');
  state.notificationTimer = setTimeout(() => {
    el.classList.remove('opacity-100', 'translate-x-0');
    el.classList.add('opacity-0', 'translate-x-96');
    state.notificationTimer = null;
  }, duration);
}

function showUndo(message, onUndo) {
  const toast = elements.undoToast;
  if (!toast) return;
  const msgEl = document.getElementById('undoMessage');
  const btn = document.getElementById('undoButton');

  if (toast._timer) clearTimeout(toast._timer);
  if (toast._btn) toast._btn.onclick = null;

  msgEl.textContent = message;
  toast._btn = btn;
  btn.onclick = () => {
    clearTimeout(toast._timer);
    hideUndo();
    if (typeof onUndo === 'function') onUndo();
  };
  toast.classList.remove('translate-y-32', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  toast._timer = setTimeout(hideUndo, UNDO_MS);
  state.undoTimer = toast._timer;
}

function hideUndo() {
  const toast = elements.undoToast;
  if (!toast) return;
  toast.classList.remove('translate-y-0', 'opacity-100');
  toast.classList.add('translate-y-32', 'opacity-0');
  if (toast._btn) toast._btn.onclick = null;
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = null;
  toast._btn = null;
  state.undoTimer = null;
}
