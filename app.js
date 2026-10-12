const USER = { name: 'Martina López', email: 'martina.lopez@email.com', phone: '+54 9 11 4567-8901' };
const initialRetreats = [
  { id: 'demo-1', name: 'Volver a lo esencial', theme: 'Bienestar integral', organizer: 'Casa Calma', organizerEmail: 'hola@casacalma.com', organizerPhone: '+54 9 11 4321-8890', start: '2026-11-14', end: '2026-11-16', location: 'Tigre, Buenos Aires', description: 'Tres días para bajar el ritmo, reconectar con lo simple y crear espacio para lo que importa.', price: 185000, activities: ['Yoga al amanecer', 'Meditación guiada', 'Círculo de palabra'], guests: [], payments: [], participation: 'A confirmar', items: [] },
  { id: 'demo-2', name: 'Entre montañas', theme: 'Naturaleza', organizer: 'Andar Serena', organizerEmail: 'hola@andarserena.com', organizerPhone: '+54 9 294 455-2010', start: '2026-12-05', end: '2026-12-08', location: 'Villa La Angostura, Neuquén', description: 'Caminatas conscientes, aire de montaña y descanso en comunidad.', price: 260000, activities: ['Caminata consciente', 'Taller de respiración', 'Alimentación consciente'], guests: [{ name: 'Lucía Pérez', relation: 'Amiga' }], payments: [{ date: '2026-09-20', amount: 60000, description: 'Seña' }], participation: 'Confirmada', items: ['Calzado de trekking', 'Abrigo', 'Protector solar'] }
];
// La agenda y sus cambios existen solo durante esta sesión de la página.
let retreats = initialRetreats.map(item => ({ ...item, activities: [...item.activities], guests: item.guests.map(guest => ({ ...guest })), payments: item.payments.map(payment => ({ ...payment })), items: [...item.items] }));
let guests = [];
let activities = [];
let currentStep = 1;
let toastTimer;

function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
function isoDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(String(value || '').trim());
  if (!match) return '';
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText), month = Number(monthText), year = 2000 + Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${year}-${monthText}-${dayText}`;
}
function dateField(value) { if (!value) return ''; const [year, month, day] = value.split('-'); return `${day}/${month}/${year.slice(-2)}`; }
function dateLabel(value) { if (!value) return '—'; const iso = String(value).includes('/') ? isoDate(value) : value; return iso ? dateField(iso) : '—'; }
function money(value) { if (value === null || value === '' || value === undefined) return 'Sin costo registrado'; return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value) || 0); }
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3000); }
function go(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active-view', el.id === view));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'consultar') renderConsultList();
  if (view === 'modificar') renderEditList();
  if (view === 'registrar') renderRegisteredPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => go(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
document.querySelector('#current-date').textContent = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

const form = document.querySelector('#retreat-form');
const errorBox = document.querySelector('#form-error');
function setStep(step) {
  currentStep = step;
  document.querySelectorAll('.form-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
  document.querySelector('#step-label').textContent = `PASO ${step} DE 3`;
  document.querySelector('#step-progress').style.width = `${step * 33.333}%`;
  document.querySelector('#back-step').classList.toggle('hidden', step === 1);
  document.querySelector('#next-step').classList.toggle('hidden', step === 3);
  document.querySelector('#submit-retreat').classList.toggle('hidden', step !== 3);
  errorBox.classList.add('hidden'); errorBox.textContent = '';
  if (step === 3) renderSummary();
}
function showError(message) { errorBox.textContent = message; errorBox.classList.remove('hidden'); errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function validateStep(step) {
  const section = document.querySelector(`.form-step[data-step="${step}"]`);
  const missing = [...section.querySelectorAll('[required]')].find(field => !field.value.trim());
  if (missing) { missing.focus(); return 'Completá todos los campos obligatorios para continuar.'; }
  const invalid = [...section.querySelectorAll('input, textarea')].find(field => field.value.trim() && !field.checkValidity());
  if (invalid) { invalid.focus(); return ['start', 'end'].includes(invalid.name) ? 'Ingresá las fechas con el formato dd/mm/yy. Por ejemplo: 25/11/26.' : 'Revisá el formato de los datos ingresados.'; }
  if (step === 1) {
    const start = isoDate(form.elements.start.value); const end = isoDate(form.elements.end.value);
    if (!start || !end) return 'Ingresá las fechas con el formato dd/mm/yy. Por ejemplo: 25/11/26.';
    if (end <= start) { form.elements.end.focus(); return 'La fecha de fin debe ser posterior a la fecha de inicio.'; }
    const price = form.elements.price.value.trim();
    if (price && (!Number.isFinite(Number(price)) || Number(price) < 0)) return 'El costo debe ser igual o mayor a cero.';
  }
  return '';
}
document.querySelector('#next-step').addEventListener('click', () => { const error = validateStep(currentStep); if (error) return showError(error); setStep(currentStep + 1); });
document.querySelector('#back-step').addEventListener('click', () => setStep(Math.max(1, currentStep - 1)));
document.querySelectorAll('input[name="hasGuests"]').forEach(input => input.addEventListener('change', () => document.querySelector('#guest-entry').classList.toggle('hidden', form.elements.hasGuests.value !== 'yes')));
document.querySelector('#add-activity').addEventListener('click', () => {
  const input = document.querySelector('#activity-input'); const value = input.value.trim();
  if (!value) return showError('Escribí el nombre de una actividad para agregarla.');
  activities.push(value); input.value = ''; errorBox.classList.add('hidden'); renderActivityList(); renderSummary();
});
function renderActivityList() { document.querySelector('#activity-list').innerHTML = activities.map((activity, index) => `<div class="entry-chip"><span>${escapeHtml(activity)}</span><button type="button" data-remove-activity="${index}" aria-label="Quitar actividad">×</button></div>`).join(''); }
document.querySelector('#activity-list').addEventListener('click', event => { const button = event.target.closest('[data-remove-activity]'); if (!button) return; activities.splice(Number(button.dataset.removeActivity), 1); renderActivityList(); renderSummary(); });
document.querySelector('#add-guest').addEventListener('click', () => {
  const name = document.querySelector('#guest-name').value.trim(); const relation = document.querySelector('#guest-relation').value.trim();
  if (!name || !relation) return showError('Ingresá el nombre y el vínculo del acompañante.');
  guests.push({ name, relation }); document.querySelector('#guest-name').value = ''; document.querySelector('#guest-relation').value = ''; errorBox.classList.add('hidden'); renderGuestList(); renderSummary();
});
function renderGuestList() { document.querySelector('#guest-list').innerHTML = guests.map((guest, index) => `<div class="entry-chip"><span>${escapeHtml(guest.name)} · ${escapeHtml(guest.relation)}</span><button type="button" data-remove-guest="${index}" aria-label="Quitar acompañante">×</button></div>`).join(''); }
document.querySelector('#guest-list').addEventListener('click', event => { const button = event.target.closest('[data-remove-guest]'); if (!button) return; guests.splice(Number(button.dataset.removeGuest), 1); renderGuestList(); renderSummary(); });
function renderSummary() {
  const data = new FormData(form);
  document.querySelector('#retreat-summary').innerHTML = `<h3>Resumen del retiro</h3><div class="summary-line"><span class="summary-label">Nombre</span><strong>${escapeHtml(data.get('name') || '—')}</strong></div><div class="summary-line"><span class="summary-label">Fechas</span><span>${dateLabel(data.get('start'))} – ${dateLabel(data.get('end'))}</span></div><div class="summary-line"><span class="summary-label">Ubicación</span><span>${escapeHtml(data.get('location') || '—')}</span></div><div class="summary-line"><span class="summary-label">Temática</span><span>${escapeHtml(data.get('theme') || '—')}</span></div><div class="summary-line"><span class="summary-label">Organizador</span><span>${escapeHtml(data.get('organizer') || '—')}</span></div><div class="summary-line"><span class="summary-label">Actividades</span><span>${activities.map(escapeHtml).join(', ') || '—'}</span></div><div class="summary-line"><span class="summary-label">Acompañantes</span><span>${form.elements.hasGuests.value === 'yes' ? guests.map(g => escapeHtml(g.name)).join(', ') || 'Ninguno agregado' : 'Sin acompañantes'}</span></div><div class="summary-line"><strong>Costo total</strong><strong>${money(data.get('price'))}</strong></div>`;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  let error = validateStep(1); if (error) { setStep(1); showError(error); return; }
  error = validateStep(2); if (error) { setStep(2); showError(error); return; }
  const data = new FormData(form);
  const optional = key => String(data.get(key) || '').trim();
  retreats.unshift({ id: `retreat-${Date.now()}`, name: optional('name'), theme: optional('theme'), organizer: optional('organizer'), organizerEmail: optional('organizerEmail'), organizerPhone: optional('organizerPhone'), start: isoDate(optional('start')), end: isoDate(optional('end')), location: optional('location'), description: optional('description'), price: optional('price') ? Number(optional('price')) : null, activities: [...activities], guests: form.elements.hasGuests.value === 'yes' ? [...guests] : [], payments: [], participation: '', items: [] });
  form.reset(); guests = []; activities = []; renderGuestList(); renderActivityList(); document.querySelector('#guest-entry').classList.add('hidden'); setStep(1); showToast('Retiro agregado a tu agenda.'); go('consultar');
});

function retreatRow(item, actionLabel, actionAttr) {
  return `<article class="retreat-row"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.theme)} · ${escapeHtml(item.location)}</p></div><div class="retreat-meta">${dateLabel(item.start)} – ${dateLabel(item.end)}<br>${money(item.price)}</div><div class="row-actions"><button class="small-action" ${actionAttr}="${escapeHtml(item.id)}">${actionLabel}</button></div></article>`;
}
function listEmpty(title, copy, action = '') { return `<div class="empty-state"><div class="empty-icon">✳</div><h3>${title}</h3><p>${copy}</p>${action}</div>`; }
function renderConsultList() {
  document.querySelector('#my-retreats').innerHTML = retreats.length ? retreats.map(item => retreatRow(item, 'Ver detalle', 'data-detail')).join('') : listEmpty('Tu agenda está vacía', 'Registrá un retiro para tener su información a mano.', '<button class="button primary" data-go="registrar">Registrar retiro</button>');
}
function renderRegisteredPreview() {
  const container = document.querySelector('#registered-preview'); if (!container) return;
  container.innerHTML = `<div class="list-heading"><div><span class="eyebrow">AGENDA PERSONAL</span><h2>Retiros en tu agenda</h2></div><span class="list-count">${retreats.length} ${retreats.length === 1 ? 'retiro' : 'retiros'}</span></div>${retreats.length ? `<div class="retreat-list">${retreats.map(item => retreatRow(item, 'Ver detalle', 'data-detail')).join('')}</div>` : listEmpty('Todavía no hay retiros', 'Al registrar uno, aparecerá en esta lista.')}`;
}
function renderEditList() {
  document.querySelector('#edit-retreats').innerHTML = retreats.length ? retreats.map(item => retreatRow(item, 'Modificar', 'data-edit')).join('') : listEmpty('No hay retiros para modificar', 'Primero agregá un retiro a tu agenda.', '<button class="button primary" data-go="registrar">Registrar retiro</button>');
}
function detailMarkup(item) {
  const guestsHtml = item.guests.length ? `<div class="dialog-section"><span>Acompañantes</span><strong>${item.guests.map(g => `${escapeHtml(g.name)} (${escapeHtml(g.relation)})`).join(', ')}</strong></div>` : '';
  const itemsHtml = item.items.length ? `<div class="dialog-section"><span>Elementos necesarios</span><strong>${item.items.map(escapeHtml).join(', ')}</strong></div>` : '';
  const paymentsHtml = item.payments.length ? item.payments.map(payment => `${dateLabel(payment.date)} · ${money(payment.amount)}${payment.description ? ` · ${escapeHtml(payment.description)}` : ''}`).join('<br>') : 'No existen pagos registrados.';
  return `<span class="dialog-kicker">AGENDA PERSONAL · ${escapeHtml(item.theme)}</span><h2>${escapeHtml(item.name)}</h2><p class="dialog-desc">${escapeHtml(item.description)}</p><div class="dialog-details"><div>Fecha de inicio<strong>${dateLabel(item.start)}</strong></div><div>Fecha de fin<strong>${dateLabel(item.end)}</strong></div><div>Ubicación<strong>${escapeHtml(item.location)}</strong></div><div>Costo total<strong>${money(item.price)}</strong></div></div><div class="dialog-section"><span>Temática</span><strong>${escapeHtml(item.theme)}</strong></div><div class="dialog-section"><span>Organizador</span><strong>${escapeHtml(item.organizer)}<br>${escapeHtml(item.organizerEmail)} · ${escapeHtml(item.organizerPhone)}</strong></div><div class="dialog-section"><span>Actividades</span><strong>${item.activities.map(escapeHtml).join(', ')}</strong></div>${guestsHtml}<div class="dialog-section"><span>Pagos registrados</span><strong>${paymentsHtml}</strong></div><div class="dialog-section"><span>Estado de participación</span><strong>${escapeHtml(item.participation || 'Sin estado registrado')}</strong></div>${itemsHtml}`;
}
document.body.addEventListener('click', event => {
  const detail = event.target.closest('[data-detail]');
  if (detail) { const item = retreats.find(entry => entry.id === detail.dataset.detail); if (!item) return; document.querySelector('#dialog-content').innerHTML = detailMarkup(item); document.querySelector('#detail-dialog').showModal(); }
  const edit = event.target.closest('[data-edit]');
  if (edit) openEdit(edit.dataset.edit);
});

function splitLines(value) { return value.split(/[\n,]/).map(part => part.trim()).filter(Boolean); }
function optionalEditPriceInvalid(editForm) { const price = String(editForm.elements.price.value || '').trim(); return Boolean(price && (!Number.isFinite(Number(price)) || Number(price) < 0)); }
function openEdit(id) {
  const item = retreats.find(entry => entry.id === id); if (!item) return;
  const content = document.querySelector('#edit-content');
  content.innerHTML = `<span class="dialog-kicker">MODIFICAR · AGENDA PERSONAL</span><h2>Actualizar retiro.</h2><p class="dialog-desc">Editá la información y revisá los cambios antes de confirmarlos.</p><form id="edit-form" class="edit-form" novalidate><div class="field-grid"><label class="field full">Nombre del retiro <span>*</span><input name="name" required value="${escapeHtml(item.name)}"></label><label class="field">Costo total (ARS) <span>*</span><input name="price" type="number" min="0" required value="${Number(item.price)}"></label><label class="field">Temática <span>*</span><input name="theme" required value="${escapeHtml(item.theme)}"></label><label class="field">Fecha de inicio <span>*</span><input name="start" type="date" required value="${item.start}"></label><label class="field">Fecha de fin <span>*</span><input name="end" type="date" required value="${item.end}"></label><label class="field full">Ubicación <span>*</span><input name="location" required value="${escapeHtml(item.location)}"></label><label class="field full">Descripción <span>*</span><textarea name="description" required rows="3">${escapeHtml(item.description)}</textarea></label><label class="field">Organizador <span>*</span><input name="organizer" required value="${escapeHtml(item.organizer)}"></label><label class="field">Correo del organizador <span>*</span><input name="organizerEmail" type="email" required value="${escapeHtml(item.organizerEmail)}"></label><label class="field full">Teléfono del organizador <span>*</span><input name="organizerPhone" required value="${escapeHtml(item.organizerPhone)}"></label><label class="field full">Actividades <span>*</span><small class="edit-hint">Una por línea o separadas por coma.</small><textarea name="activities" required rows="3">${escapeHtml(item.activities.join('\n'))}</textarea></label><label class="field full">Acompañantes<small class="edit-hint">Uno por línea como Nombre | Vínculo.</small><textarea name="guests" rows="2">${escapeHtml(item.guests.map(g => `${g.name} | ${g.relation}`).join('\n'))}</textarea></label><label class="field full">Estado de participación<input name="participation" value="${escapeHtml(item.participation || '')}" placeholder="Ej. Confirmada"></label><label class="field full">Elementos necesarios<small class="edit-hint">Separados por coma o por línea.</small><textarea name="items" rows="2">${escapeHtml(item.items.join('\n'))}</textarea></label></div><div id="edit-error" class="form-error hidden" role="alert"></div><div id="edit-summary" class="summary-box hidden"></div><div class="edit-actions"><button type="button" class="button quiet" id="cancel-edit">Cancelar</button><button type="button" class="button primary" id="preview-edit">Ver resumen</button><button type="button" class="button primary hidden" id="save-edit">Confirmar cambios <span>✓</span></button></div></form>`;
  const editForm = document.querySelector('#edit-form');
  editForm.elements.price.value = item.price ?? '';
  editForm.querySelectorAll('[required]').forEach(field => field.removeAttribute('required'));
  ['name', 'location', 'start', 'end'].forEach(name => { editForm.elements[name].required = true; });
  editForm.querySelectorAll('.field > span, .field-title > span').forEach(star => { if (!star.parentElement.querySelector('[required]')) star.remove(); });
  ['start', 'end'].forEach(name => { const field = editForm.elements[name]; field.type = 'text'; field.inputMode = 'numeric'; field.pattern = '[0-9]{2}/[0-9]{2}/[0-9]{2}'; field.placeholder = 'dd/mm/yy'; field.value = dateField(item[name]); });
  document.querySelector('#edit-dialog').showModal();
  document.querySelector('#cancel-edit').addEventListener('click', () => document.querySelector('#edit-dialog').close());
  document.querySelector('#preview-edit').addEventListener('click', () => {
    const button = document.querySelector('#preview-edit'); const editForm = document.querySelector('#edit-form'); const summary = document.querySelector('#edit-summary');
    if (button.dataset.preview === 'true') { editForm.querySelectorAll('input, textarea').forEach(field => { field.readOnly = false; }); summary.classList.add('hidden'); document.querySelector('#save-edit').classList.add('hidden'); button.dataset.preview = 'false'; button.textContent = 'Ver resumen'; return; }
    previewEdit(item.id);
  });
  document.querySelector('#save-edit').addEventListener('click', () => saveEdit(item.id));
}
function editValues() {
  const editForm = document.querySelector('#edit-form'); const data = new FormData(editForm);
  const optional = key => String(data.get(key) || '').trim();
  return { name: optional('name'), price: optional('price') ? Number(optional('price')) : null, theme: optional('theme'), start: isoDate(optional('start')), end: isoDate(optional('end')), location: optional('location'), description: optional('description'), organizer: optional('organizer'), organizerEmail: optional('organizerEmail'), organizerPhone: optional('organizerPhone'), activities: splitLines(optional('activities')), guests: optional('guests').split('\n').map(row => row.trim()).filter(Boolean).map(row => { const [name, ...relation] = row.split('|').map(part => part.trim()); return { name, relation: relation.join(' | ') || 'Acompañante' }; }), participation: optional('participation'), items: splitLines(optional('items')) };
}
function previewEdit(id) {
  const editForm = document.querySelector('#edit-form'); const error = document.querySelector('#edit-error');
  const missing = [...editForm.querySelectorAll('[required]')].find(field => !field.value.trim());
  if (missing) { error.textContent = 'Completá todos los campos obligatorios.'; error.classList.remove('hidden'); missing.focus(); return; }
  const invalid = [...editForm.querySelectorAll('input, textarea')].find(field => field.value.trim() && !field.checkValidity());
  if (invalid) { error.textContent = ['start', 'end'].includes(invalid.name) ? 'Ingresá las fechas con el formato dd/mm/yy.' : 'Revisá el formato de los datos ingresados.'; error.classList.remove('hidden'); invalid.focus(); return; }
  const values = editValues();
  if (!values.start || !values.end) { error.textContent = 'Ingresá las fechas con el formato dd/mm/yy.'; error.classList.remove('hidden'); return; }
  if (values.end <= values.start) { error.textContent = 'La fecha de fin debe ser posterior a la fecha de inicio.'; error.classList.remove('hidden'); editForm.elements.end.focus(); return; }
  if (optionalEditPriceInvalid(editForm)) { error.textContent = 'El costo debe ser igual o mayor a cero.'; error.classList.remove('hidden'); editForm.elements.price.focus(); return; }
  error.classList.add('hidden');
  const summary = document.querySelector('#edit-summary');
  summary.innerHTML = `<h3>Resumen de cambios</h3><div class="summary-line"><span class="summary-label">Retiro</span><strong>${escapeHtml(values.name)}</strong></div><div class="summary-line"><span class="summary-label">Fechas</span><span>${dateLabel(values.start)} – ${dateLabel(values.end)}</span></div><div class="summary-line"><span class="summary-label">Ubicación</span><span>${escapeHtml(values.location)}</span></div><div class="summary-line"><span class="summary-label">Descripción</span><span>${escapeHtml(values.description)}</span></div><div class="summary-line"><span class="summary-label">Temática</span><span>${escapeHtml(values.theme)}</span></div><div class="summary-line"><span class="summary-label">Organizador</span><span>${escapeHtml(values.organizer)} · ${escapeHtml(values.organizerEmail)} · ${escapeHtml(values.organizerPhone)}</span></div><div class="summary-line"><span class="summary-label">Actividades</span><span>${values.activities.map(escapeHtml).join(', ')}</span></div><div class="summary-line"><span class="summary-label">Acompañantes</span><span>${values.guests.map(g => `${escapeHtml(g.name)} (${escapeHtml(g.relation)})`).join(', ') || 'Sin acompañantes'}</span></div><div class="summary-line"><span class="summary-label">Participación</span><span>${escapeHtml(values.participation || 'Sin estado registrado')}</span></div><div class="summary-line"><span class="summary-label">Elementos necesarios</span><span>${values.items.map(escapeHtml).join(', ') || 'Sin elementos registrados'}</span></div><div class="summary-line"><strong>Costo total</strong><strong>${money(values.price)}</strong></div>`;
  summary.classList.remove('hidden'); document.querySelector('#save-edit').classList.remove('hidden'); document.querySelector('#preview-edit').textContent = 'Volver a editar';
  editForm.querySelectorAll('input, textarea').forEach(field => { field.readOnly = true; });
  const previewButton = document.querySelector('#preview-edit'); previewButton.dataset.preview = 'true'; previewButton.textContent = 'Volver a editar';
}
function saveEdit(id) {
  const item = retreats.find(entry => entry.id === id); if (!item) return;
  Object.assign(item, editValues());
  document.querySelector('#edit-dialog').close(); renderEditList(); renderConsultList(); renderRegisteredPreview(); showToast('Los cambios se aplicaron a este retiro.');
}
document.querySelectorAll('.detail-dialog .dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('.detail-dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
renderConsultList(); renderEditList(); renderRegisteredPreview();
