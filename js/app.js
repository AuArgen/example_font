/*
  Логика интерфейса.
  Этот файл отвечает за формы, кнопки, таблицу результата и сообщения об ошибках.
*/

let currentResource = 'clients';

const elements = {
  apiBaseInput: document.getElementById('apiBaseInput'),
  tokenInput: document.getElementById('tokenInput'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  clearConfigBtn: document.getElementById('clearConfigBtn'),
  configStatus: document.getElementById('configStatus'),
  actionSelect: document.getElementById('actionSelect'),
  recordIdInput: document.getElementById('recordIdInput'),
  apiForm: document.getElementById('apiForm'),
  runRequestBtn: document.getElementById('runRequestBtn'),
  fillDemoBtn: document.getElementById('fillDemoBtn'),
  activeEndpoint: document.getElementById('activeEndpoint'),
  requestFormMessage: document.getElementById('requestFormMessage'),
  messageBox: document.getElementById('messageBox'),
  tableBox: document.getElementById('tableBox'),
  jsonOutput: document.getElementById('jsonOutput'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
};

function initConfigForm() {
  const config = loadConfig();
  elements.apiBaseInput.value = config.apiBase || '';
  elements.tokenInput.value = config.token || '';
  updateConfigStatus();
}

function updateConfigStatus() {
  const ready = elements.apiBaseInput.value.trim() && elements.tokenInput.value.trim();
  elements.configStatus.classList.toggle('ready', Boolean(ready));
}

function setMessage(text, type = 'success') {
  elements.messageBox.textContent = text;
  elements.messageBox.className = `message ${type}`;
}

function clearMessage() {
  elements.messageBox.className = 'message hidden';
  elements.messageBox.textContent = '';
}

function fieldError(message, fieldName) {
  const error = new Error(message);
  error.fieldName = fieldName;
  return error;
}

function clearRequestFormFeedback() {
  elements.apiForm.querySelectorAll('.field.invalid').forEach((field) => {
    field.classList.remove('invalid');
  });
  document.getElementById('recordIdInput')?.closest('.field')?.classList.remove('invalid');
  elements.requestFormMessage.className = 'form-message hidden';
  elements.requestFormMessage.textContent = '';
}

function showRequestFormFeedback(message, type = 'error', fieldName = '') {
  elements.requestFormMessage.textContent = message;
  elements.requestFormMessage.className = `form-message ${type}`;

  const input = fieldName === 'id'
    ? elements.recordIdInput
    : elements.apiForm.querySelector(`[name="${fieldName}"]`);

  if (input) {
    input.closest('.field')?.classList.add('invalid');
    input.focus();
  }
}

function renderActions() {
  const resource = resources[currentResource];
  elements.actionSelect.innerHTML = Object.entries(resource.actions)
    .map(([key, action]) => `<option value="${key}">${action.label}</option>`)
    .join('');

  renderForm();
}

function currentAction() {
  return resources[currentResource].actions[elements.actionSelect.value];
}

function shouldShowField(field, actionKey) {
  if (field.onlyFor) {
    return field.onlyFor.includes(actionKey);
  }

  const action = resources[currentResource].actions[actionKey];
  if (action.needsPostId) {
    return field.name === 'post_id';
  }

  return ['POST', 'PUT', 'PATCH'].includes(action.method);
}

function fieldHtml(field, actionKey) {
  const required = field.requiredFor?.includes(actionKey) ? 'required' : '';
  const requiredMark = required ? '<b>*</b>' : '';

  if (field.type === 'select') {
    return `<label class="field">
      <span>${field.label} ${requiredMark}</span>
      <select name="${field.name}" ${required}>
        ${field.options.map((option) => `<option value="${option}">${option}</option>`).join('')}
      </select>
    </label>`;
  }

  return `<label class="field">
    <span>${field.label} ${requiredMark}</span>
    <input name="${field.name}" type="${field.type || 'text'}" placeholder="${field.placeholder || ''}" ${required}>
  </label>`;
}

function renderForm() {
  clearRequestFormFeedback();
  const resource = resources[currentResource];
  const actionKey = elements.actionSelect.value;
  const action = currentAction();

  elements.activeEndpoint.textContent = `${action.method} ${action.path}`;
  elements.recordIdInput.disabled = !action.needsId;
  elements.recordIdInput.placeholder = action.needsId ? 'Например 12' : 'Для этого действия не нужен';

  const fields = resource.fields.filter((field) => shouldShowField(field, actionKey));
  elements.apiForm.innerHTML = fields.length
    ? fields.map((field) => fieldHtml(field, actionKey)).join('')
    : '<p class="hint">Для этого действия дополнительные поля не нужны.</p>';
}

function fillDemoValues() {
  clearRequestFormFeedback();
  const demo = resources[currentResource].demo;
  elements.apiForm.querySelectorAll('input, select').forEach((input) => {
    input.value = demo[input.name] ?? '';
  });
}

function collectBody() {
  const actionKey = elements.actionSelect.value;
  const action = currentAction();
  const resource = resources[currentResource];
  const body = {};

  resource.fields.forEach((field) => {
    const input = elements.apiForm.querySelector(`[name="${field.name}"]`);
    if (!input) {
      return;
    }

    const value = normalizeValue(input.value, field);
    const isRequired = field.requiredFor?.includes(actionKey);

    if (isRequired && (value === null || value === '')) {
      throw fieldError(`Нужно заполнить поле: ${field.name}`, field.name);
    }

    if (action.bodyOnly && !action.bodyOnly.includes(field.name)) {
      return;
    }

    if (value !== null && value !== '') {
      body[field.name] = value;
    } else if (field.name === 'parent_id' || field.name === 'client_id') {
      body[field.name] = null;
    }
  });

  return body;
}

function buildPath(action, body) {
  let path = action.path;

  if (action.needsId) {
    const id = elements.recordIdInput.value.trim();
    if (!id) {
      throw fieldError('Нужно заполнить поле: ID записи', 'id');
    }
    path = path.replace('{id}', id);
  }

  if (action.needsPostId) {
    const postId = body.post_id;
    if (!postId) {
      throw fieldError('Нужно заполнить поле: post_id', 'post_id');
    }
    path = path.replace('{post_id}', postId);
  }

  return path;
}

function normalizeRows(data) {
  const source = data?.data ?? data?.category ?? data?.comment ?? data;

  if (Array.isArray(source)) {
    return source;
  }

  if (source && typeof source === 'object') {
    return [source];
  }

  return [];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTable(data) {
  const rows = normalizeRows(data);
  elements.jsonOutput.textContent = JSON.stringify(data, null, 2);

  if (!rows.length) {
    elements.tableBox.innerHTML = '<div class="hint">Таблица пустая. JSON-ответ показан ниже.</div>';
    return;
  }

  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).slice(0, 10).forEach((key) => set.add(key));
    return set;
  }, new Set())).slice(0, 8);

  elements.tableBox.innerHTML = `<table>
    <thead>
      <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map((row) => `<tr>${columns.map((column) => {
        const value = row[column];
        const text = value && typeof value === 'object' ? JSON.stringify(value) : value ?? '';
        return `<td>${escapeHtml(text)}</td>`;
      }).join('')}</tr>`).join('')}
    </tbody>
  </table>`;
}

async function runRequest() {
  clearMessage();
  clearRequestFormFeedback();

  try {
    const action = currentAction();
    const body = collectBody();
    const path = buildPath(action, body);
    const data = await apiRequest(path, {
      method: action.method,
      body,
    });

    renderTable(data);
    setMessage('Запрос выполнен успешно.', 'success');
    showRequestFormFeedback('Запрос отправлен успешно.', 'success');
  } catch (error) {
    showRequestFormFeedback(error.message, 'error', error.fieldName);
  }
}

function setResource(resourceName) {
  currentResource = resourceName;

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.resource === resourceName);
  });

  elements.recordIdInput.value = '';
  renderActions();
  fillDemoValues();
}

elements.saveConfigBtn.addEventListener('click', () => {
  saveConfig({
    apiBase: elements.apiBaseInput.value.trim().replace(/\/$/, ''),
    token: elements.tokenInput.value.trim(),
  });
  updateConfigStatus();
  setMessage('Настройки сохранены.', 'success');
});

elements.clearConfigBtn.addEventListener('click', () => {
  clearConfig();
  elements.apiBaseInput.value = '';
  elements.tokenInput.value = '';
  updateConfigStatus();
  setMessage('Настройки очищены.', 'success');
});

elements.apiBaseInput.addEventListener('input', updateConfigStatus);
elements.tokenInput.addEventListener('input', updateConfigStatus);
elements.actionSelect.addEventListener('change', () => {
  renderForm();
  fillDemoValues();
});
elements.recordIdInput.addEventListener('input', clearRequestFormFeedback);
elements.apiForm.addEventListener('input', (event) => {
  event.target.closest('.field')?.classList.remove('invalid');
  elements.requestFormMessage.className = 'form-message hidden';
  elements.requestFormMessage.textContent = '';
});
elements.runRequestBtn.addEventListener('click', runRequest);
elements.fillDemoBtn.addEventListener('click', fillDemoValues);
elements.copyJsonBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(elements.jsonOutput.textContent);
    setMessage('JSON скопирован.', 'success');
  } catch (error) {
    setMessage('Браузер не разрешил копирование. Выделите JSON вручную.', 'error');
  }
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => setResource(tab.dataset.resource));
});

initConfigForm();
setResource('clients');
