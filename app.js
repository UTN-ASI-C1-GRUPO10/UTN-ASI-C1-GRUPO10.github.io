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
function dateLabel(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) { if (!value) return '—'; return new Intl.DateTimeFormat('es-AR', options).format(new Date(`${value}T12:00:00`)); }
function money(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value) || 0); }
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
  const invalid = [...section.querySelectorAll('[required]')].find(field => !field.checkValidity());
  if (invalid) { invalid.focus(); return 'Revisá el formato de los datos ingresados.'; }
  if (step === 1 && form.elements.end.value <= form.elements.start.value) { form.elements.end.focus(); return 'La fecha de fin debe ser posterior a la fecha de inicio.'; }
  if (step === 2 && activities.length === 0) return 'Agregá al menos una actividad al retiro.';
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
  if (form.elements.hasGuests.value === 'yes' && guests.length === 0) { showError('Agregá al menos un acompañante o elegí continuar sin acompañantes.'); return; }
  const data = new FormData(form);
  retreats.unshift({ id: `retreat-${Date.now()}`, name: data.get('name').trim(), theme: data.get('theme').trim(), organizer: data.get('organizer').trim(), organizerEmail: data.get('organizerEmail').trim(), organizerPhone: data.get('organizerPhone').trim(), start: data.get('start'), end: data.get('end'), location: data.get('location').trim(), description: data.get('description').trim(), price: Number(data.get('price')), activities: [...activities], guests: form.elements.hasGuests.value === 'yes' ? [...guests] : [], payments: [], participation: 'A confirmar', items: [] });
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
function openEdit(id) {
  const item = retreats.find(entry => entry.id === id); if (!item) return;
  const content = document.querySelector('#edit-content');
  content.innerHTML = `<span class="dialog-kicker">MODIFICAR · AGENDA PERSONAL</span><h2>Actualizar retiro.</h2><p class="dialog-desc">Editá la información y revisá los cambios antes de confirmarlos.</p><form id="edit-form" class="edit-form" novalidate><div class="field-grid"><label class="field full">Nombre del retiro <span>*</span><input name="name" required value="${escapeHtml(item.name)}"></label><label class="field">Costo total (ARS) <span>*</span><input name="price" type="number" min="0" required value="${Number(item.price)}"></label><label class="field">Temática <span>*</span><input name="theme" required value="${escapeHtml(item.theme)}"></label><label class="field">Fecha de inicio <span>*</span><input name="start" type="date" required value="${item.start}"></label><label class="field">Fecha de fin <span>*</span><input name="end" type="date" required value="${item.end}"></label><label class="field full">Ubicación <span>*</span><input name="location" required value="${escapeHtml(item.location)}"></label><label class="field full">Descripción <span>*</span><textarea name="description" required rows="3">${escapeHtml(item.description)}</textarea></label><label class="field">Organizador <span>*</span><input name="organizer" required value="${escapeHtml(item.organizer)}"></label><label class="field">Correo del organizador <span>*</span><input name="organizerEmail" type="email" required value="${escapeHtml(item.organizerEmail)}"></label><label class="field full">Teléfono del organizador <span>*</span><input name="organizerPhone" required value="${escapeHtml(item.organizerPhone)}"></label><label class="field full">Actividades <span>*</span><small class="edit-hint">Una por línea o separadas por coma.</small><textarea name="activities" required rows="3">${escapeHtml(item.activities.join('\n'))}</textarea></label><label class="field full">Acompañantes<small class="edit-hint">Uno por línea como Nombre | Vínculo.</small><textarea name="guests" rows="2">${escapeHtml(item.guests.map(g => `${g.name} | ${g.relation}`).join('\n'))}</textarea></label><label class="field full">Estado de participación<input name="participation" value="${escapeHtml(item.participation || '')}" placeholder="Ej. Confirmada"></label><label class="field full">Elementos necesarios<small class="edit-hint">Separados por coma o por línea.</small><textarea name="items" rows="2">${escapeHtml(item.items.join('\n'))}</textarea></label></div><div id="edit-error" class="form-error hidden" role="alert"></div><div id="edit-summary" class="summary-box hidden"></div><div class="edit-actions"><button type="button" class="button quiet" id="cancel-edit">Cancelar</button><button type="button" class="button primary" id="preview-edit">Ver resumen</button><button type="button" class="button primary hidden" id="save-edit">Confirmar cambios <span>✓</span></button></div></form>`;
  document.querySelector('#edit-dialog').showModal();
  document.querySelector('#cancel-edit').addEventListener('click', () => document.querySelector('#edit-dialog').close());
  document.querySelector('#preview-edit').addEventListener('click', () => previewEdit(item.id));
  document.querySelector('#save-edit').addEventListener('click', () => saveEdit(item.id));
}
function editValues() {
  const editForm = document.querySelector('#edit-form'); const data = new FormData(editForm);
  return { name: data.get('name').trim(), price: Number(data.get('price')), theme: data.get('theme').trim(), start: data.get('start'), end: data.get('end'), location: data.get('location').trim(), description: data.get('description').trim(), organizer: data.get('organizer').trim(), organizerEmail: data.get('organizerEmail').trim(), organizerPhone: data.get('organizerPhone').trim(), activities: splitLines(data.get('activities')), guests: String(data.get('guests')).split('\n').map(row => row.trim()).filter(Boolean).map(row => { const [name, ...relation] = row.split('|').map(part => part.trim()); return { name, relation: relation.join(' | ') || 'Acompañante' }; }), participation: data.get('participation').trim(), items: splitLines(data.get('items')) };
}
function previewEdit(id) {
  const editForm = document.querySelector('#edit-form'); const error = document.querySelector('#edit-error');
  const missing = [...editForm.querySelectorAll('[required]')].find(field => !field.value.trim());
  if (missing) { error.textContent = 'Completá todos los campos obligatorios.'; error.classList.remove('hidden'); missing.focus(); return; }
  const invalid = [...editForm.querySelectorAll('[required]')].find(field => !field.checkValidity());
  if (invalid) { error.textContent = 'Revisá el formato de los datos ingresados.'; error.classList.remove('hidden'); invalid.focus(); return; }
  const values = editValues();
  if (values.end <= values.start) { error.textContent = 'La fecha de fin debe ser posterior a la fecha de inicio.'; error.classList.remove('hidden'); editForm.elements.end.focus(); return; }
  if (!Number.isFinite(values.price) || values.price < 0 || !values.activities.length) { error.textContent = 'Revisá el costo y agregá al menos una actividad.'; error.classList.remove('hidden'); return; }
  error.classList.add('hidden');
  const summary = document.querySelector('#edit-summary');
  summary.innerHTML = `<h3>Resumen de cambios</h3><div class="summary-line"><span class="summary-label">Retiro</span><strong>${escapeHtml(values.name)}</strong></div><div class="summary-line"><span class="summary-label">Fechas</span><span>${dateLabel(values.start)} – ${dateLabel(values.end)}</span></div><div class="summary-line"><span class="summary-label">Ubicación</span><span>${escapeHtml(values.location)}</span></div><div class="summary-line"><span class="summary-label">Descripción</span><span>${escapeHtml(values.description)}</span></div><div class="summary-line"><span class="summary-label">Temática</span><span>${escapeHtml(values.theme)}</span></div><div class="summary-line"><span class="summary-label">Organizador</span><span>${escapeHtml(values.organizer)} · ${escapeHtml(values.organizerEmail)} · ${escapeHtml(values.organizerPhone)}</span></div><div class="summary-line"><span class="summary-label">Actividades</span><span>${values.activities.map(escapeHtml).join(', ')}</span></div><div class="summary-line"><span class="summary-label">Acompañantes</span><span>${values.guests.map(g => `${escapeHtml(g.name)} (${escapeHtml(g.relation)})`).join(', ') || 'Sin acompañantes'}</span></div><div class="summary-line"><span class="summary-label">Participación</span><span>${escapeHtml(values.participation || 'Sin estado registrado')}</span></div><div class="summary-line"><span class="summary-label">Elementos necesarios</span><span>${values.items.map(escapeHtml).join(', ') || 'Sin elementos registrados'}</span></div><div class="summary-line"><strong>Costo total</strong><strong>${money(values.price)}</strong></div>`;
  summary.classList.remove('hidden'); document.querySelector('#save-edit').classList.remove('hidden'); document.querySelector('#preview-edit').textContent = 'Volver a editar';
  editForm.querySelectorAll('input, textarea').forEach(field => { field.readOnly = true; });
  document.querySelector('#preview-edit').onclick = () => { editForm.querySelectorAll('input, textarea').forEach(field => { field.readOnly = false; }); summary.classList.add('hidden'); document.querySelector('#save-edit').classList.add('hidden'); document.querySelector('#preview-edit').textContent = 'Ver resumen'; document.querySelector('#preview-edit').onclick = () => previewEdit(id); };
}
function saveEdit(id) {
  const item = retreats.find(entry => entry.id === id); if (!item) return;
  Object.assign(item, editValues());
  document.querySelector('#edit-dialog').close(); renderEditList(); renderConsultList(); renderRegisteredPreview(); showToast('Los cambios se aplicaron a este retiro.');
}
document.querySelectorAll('.detail-dialog .dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('.detail-dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
renderConsultList(); renderEditList(); renderRegisteredPreview();
