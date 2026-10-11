const STORAGE_KEY = 'raiz-retiros-v1';
const USER = { name: 'Martina López', email: 'martina.lopez@email.com', phone: '+54 9 11 4567-8901' };
const initialRetreats = [
  { id: 'demo-1', name: 'Volver a lo esencial', theme: 'Bienestar integral', organizer: 'Casa Calma', organizerEmail: 'hola@casacalma.com', organizerPhone: '+54 9 11 4321-8890', start: '2026-11-14', end: '2026-11-16', location: 'Tigre, Buenos Aires', description: 'Tres días para bajar el ritmo, reconectar con lo simple y crear espacio para lo que importa.', price: 185000, cancelable: true, activities: ['Yoga al amanecer', 'Meditación guiada', 'Círculo de palabra'], guests: [], status: 'Disponible', owner: 'demo', payment: 'Seña pendiente', participation: 'No inscripta', items: ['Ropa cómoda', 'Botella reutilizable', 'Mat de yoga'], enrolled: false },
  { id: 'demo-2', name: 'Entre montañas', theme: 'Naturaleza', organizer: 'Andar Serena', organizerEmail: 'hola@andarserena.com', organizerPhone: '+54 9 294 455-2010', start: '2026-12-05', end: '2026-12-08', location: 'Villa La Angostura, Neuquén', description: 'Caminatas conscientes, aire de montaña y descanso en comunidad.', price: 260000, cancelable: false, activities: ['Caminata consciente', 'Taller de respiración', 'Alimentación consciente'], guests: [], status: 'Disponible', owner: 'demo', payment: 'Sin pagos registrados', participation: 'No inscripta', items: ['Calzado de trekking', 'Abrigo', 'Protector solar'], enrolled: false },
  { id: 'demo-3', name: 'Habitar el presente', theme: 'Meditación', organizer: 'Espacio Nido', organizerEmail: 'hola@espacionido.com', organizerPhone: '+54 9 11 5090-2201', start: '2027-01-22', end: '2027-01-24', location: 'Chascomús, Buenos Aires', description: 'Una pausa amable para cultivar presencia, descanso y escucha interior.', price: 142000, cancelable: true, activities: ['Meditación guiada', 'Yoga al amanecer', 'Taller de respiración'], guests: [], status: 'Disponible', owner: 'demo', payment: 'Sin pagos registrados', participation: 'No inscripta', items: [], enrolled: false }
];
let retreats = loadRetreats();
let guests = [];
let currentStep = 1;
let selectedEnroll = null;
let toastTimer;

function loadRetreats() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return [...initialRetreats.filter(seed => !stored.some(item => item.id === seed.id)), ...stored];
  } catch (_) { /* Use the demo catalog when storage is unavailable or invalid. */ }
  return initialRetreats.map(item => ({ ...item }));
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(retreats)); } catch (_) { showToast('No se pudo guardar en este navegador.'); } }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
function dateLabel(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) { if (!value) return '—'; return new Intl.DateTimeFormat('es-AR', options).format(new Date(`${value}T12:00:00`)); }
function money(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value) || 0); }
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3000); }
function go(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active-view', el.id === view));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'consultar') renderMine();
  if (view === 'inscribirse') renderAvailable();
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
  if (step === 1) {
    const required = [...section.querySelectorAll('[required]')];
    const missing = required.find(field => !field.value.trim());
    if (missing) { missing.focus(); return 'Completá todos los campos obligatorios para continuar.'; }
    const start = form.elements.start.value; const end = form.elements.end.value;
    if (end <= start) { form.elements.end.focus(); return 'La fecha de fin debe ser posterior a la fecha de inicio.'; }
    if (Number(form.elements.price.value) < 0) return 'El costo debe ser igual o mayor a cero.';
  }
  if (step === 2) {
    const required = [...section.querySelectorAll('[required]')];
    const missing = required.find(field => !field.value.trim());
    if (missing) { missing.focus(); return 'Completá la temática y los datos de contacto del organizador.'; }
    if (!section.querySelector('input[name="activities"]:checked')) return 'Seleccioná al menos una actividad para el retiro.';
  }
  return '';
}
document.querySelector('#next-step').addEventListener('click', () => { const error = validateStep(currentStep); if (error) return showError(error); setStep(currentStep + 1); });
document.querySelector('#back-step').addEventListener('click', () => setStep(Math.max(1, currentStep - 1)));
document.querySelectorAll('input[name="hasGuests"]').forEach(input => input.addEventListener('change', () => document.querySelector('#guest-entry').classList.toggle('hidden', form.elements.hasGuests.value !== 'yes')));
document.querySelector('#add-guest').addEventListener('click', () => {
  const name = document.querySelector('#guest-name').value.trim(); const relation = document.querySelector('#guest-relation').value.trim();
  if (!name || !relation) return showError('Ingresá el nombre y el vínculo del acompañante.');
  guests.push({ name, relation }); document.querySelector('#guest-name').value = ''; document.querySelector('#guest-relation').value = ''; errorBox.classList.add('hidden'); renderGuests(); renderSummary();
});
function renderGuests() { document.querySelector('#guest-list').innerHTML = guests.map((guest, index) => `<div class="guest-chip"><span>${escapeHtml(guest.name)} · ${escapeHtml(guest.relation)}</span><button type="button" data-remove-guest="${index}" aria-label="Quitar acompañante">×</button></div>`).join(''); }
document.querySelector('#guest-list').addEventListener('click', event => { const button = event.target.closest('[data-remove-guest]'); if (!button) return; guests.splice(Number(button.dataset.removeGuest), 1); renderGuests(); renderSummary(); });
function renderSummary() {
  const data = new FormData(form); const activities = data.getAll('activities');
  document.querySelector('#retreat-summary').innerHTML = `<h3>Resumen de tu retiro</h3><div class="summary-line"><span class="summary-label">Retiro</span><strong>${escapeHtml(data.get('name') || '—')}</strong></div><div class="summary-line"><span class="summary-label">Fechas</span><span>${dateLabel(data.get('start'))} – ${dateLabel(data.get('end'))}</span></div><div class="summary-line"><span class="summary-label">Ubicación</span><span>${escapeHtml(data.get('location') || '—')}</span></div><div class="summary-line"><span class="summary-label">Temática</span><span>${escapeHtml(data.get('theme') || '—')}</span></div><div class="summary-line"><span class="summary-label">Actividades</span><span>${activities.map(escapeHtml).join(', ') || '—'}</span></div><div class="summary-line"><span class="summary-label">Acompañantes</span><span>${form.elements.hasGuests.value === 'yes' ? guests.map(g => escapeHtml(g.name)).join(', ') || 'Ninguno agregado' : 'Sin acompañantes'}</span></div><div class="summary-line"><strong>Costo total</strong><strong>${money(data.get('price'))}</strong></div>`;
}
form.addEventListener('submit', event => {
  event.preventDefault(); const error = validateStep(1) || validateStep(2); if (error) { setStep(error.includes('actividad') || error.includes('temática') ? 2 : 1); showError(error); return; }
  if (form.elements.hasGuests.value === 'yes' && guests.length === 0) { showError('Agregá al menos un acompañante o elegí continuar sin acompañantes.'); return; }
  const data = new FormData(form); const nowId = `retreat-${Date.now()}`;
  retreats.unshift({ id: nowId, name: data.get('name').trim(), theme: data.get('theme'), organizer: data.get('organizer').trim(), organizerEmail: data.get('organizerEmail').trim(), organizerPhone: data.get('organizerPhone').trim(), start: data.get('start'), end: data.get('end'), location: data.get('location').trim(), description: data.get('description').trim(), price: Number(data.get('price')), cancelable: data.get('cancelable') === 'on', activities: data.getAll('activities'), guests: form.elements.hasGuests.value === 'yes' ? [...guests] : [], status: 'Registrado', owner: 'current', payment: 'Sin pagos registrados', participation: 'Organizadora', items: [], enrolled: false });
  save(); form.reset(); guests = []; renderGuests(); document.querySelector('#guest-entry').classList.add('hidden'); setStep(1); showToast('¡Retiro registrado con éxito!'); go('consultar');
});

function renderMine() {
  const own = retreats.filter(item => item.owner === 'current' || item.enrolled);
  document.querySelector('#my-retreats').innerHTML = own.length ? own.map(item => `<article class="retreat-row"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.theme)} · ${escapeHtml(item.location)}</p></div><div class="retreat-meta">${dateLabel(item.start)} – ${dateLabel(item.end)}<br>${money(item.price)}</div><div><span class="status">${escapeHtml(item.enrolled ? item.participation : item.status)}</span></div><div class="row-actions"><button class="small-action" data-detail="${escapeHtml(item.id)}">Ver detalle</button></div></article>`).join('') : `<div class="empty-state"><div class="empty-icon">✳</div><h3>Tu agenda empieza acá</h3><p>Cuando te inscribas a un retiro o registres una propuesta, la vas a encontrar en este espacio.</p><button class="button primary" data-go="inscribirse">Explorar retiros</button></div>`;
}
function renderAvailable() {
  const available = retreats.filter(item => item.status === 'Disponible' && !item.enrolled && item.owner !== 'current');
  document.querySelector('#available-count').textContent = `${available.length} experiencias`;
  document.querySelector('#available-retreats').innerHTML = available.length ? available.map(item => `<article class="retreat-card"><div class="retreat-cover"><span class="cover-sun"></span><span class="cover-tag">${escapeHtml(item.theme)}</span></div><div class="retreat-card-body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="card-meta"><span>${dateLabel(item.start)} · ${escapeHtml(item.location.split(',')[0])}</span><strong>${money(item.price)}</strong></div><div class="card-buttons"><button data-detail="${escapeHtml(item.id)}">Ver detalles</button><button data-enroll="${escapeHtml(item.id)}">Inscribirme ↗</button></div></div></article>`).join('') : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">☼</div><h3>Por ahora no hay retiros disponibles</h3><p>Volvé pronto para descubrir nuevas experiencias.</p></div>`;
}
function detailMarkup(item) {
  const guestsHtml = item.guests?.length ? `<div class="dialog-details"><div>Acompañantes<strong>${item.guests.map(g => `${escapeHtml(g.name)} (${escapeHtml(g.relation)})`).join(', ')}</strong></div></div>` : '';
  const itemsHtml = item.items?.length ? `<div class="dialog-details"><div>Elementos para llevar<strong>${item.items.map(escapeHtml).join(', ')}</strong></div></div>` : '';
  return `<span class="dialog-kicker">${escapeHtml(item.theme)} · ${escapeHtml(item.status)}</span><h2>${escapeHtml(item.name)}</h2><p class="dialog-desc">${escapeHtml(item.description)}</p><div class="dialog-details"><div>Fechas<strong>${dateLabel(item.start)} – ${dateLabel(item.end)}</strong></div><div>Ubicación<strong>${escapeHtml(item.location)}</strong></div><div>Costo total<strong>${money(item.price)}</strong></div><div>Cancelación<strong>${item.cancelable ? 'Cancelable' : 'No cancelable'}</strong></div></div><div class="dialog-details"><div>Organizador<strong>${escapeHtml(item.organizer)}</strong></div><div>Contacto<strong>${escapeHtml(item.organizerEmail)}<br>${escapeHtml(item.organizerPhone)}</strong></div><div>Actividades<strong>${item.activities.map(escapeHtml).join(', ')}</strong></div></div>${guestsHtml}<div class="dialog-details"><div>Pago<strong>${escapeHtml(item.payment || 'Sin pagos registrados')}</strong></div><div>Participación<strong>${escapeHtml(item.participation || 'No inscripta')}</strong></div></div>${itemsHtml}`;
}
document.body.addEventListener('click', event => {
  const detail = event.target.closest('[data-detail]');
  if (detail) { const item = retreats.find(entry => entry.id === detail.dataset.detail); if (!item) return; document.querySelector('#dialog-content').innerHTML = detailMarkup(item); document.querySelector('#detail-dialog').showModal(); }
  const enroll = event.target.closest('[data-enroll]');
  if (enroll) openEnroll(enroll.dataset.enroll);
});
function openEnroll(id) {
  const item = retreats.find(entry => entry.id === id); if (!item) return;
  selectedEnroll = id;
  document.querySelector('#enroll-content').innerHTML = `<span class="dialog-kicker">INSCRIPCIÓN · ${escapeHtml(item.theme)}</span><h2>Sumate a la experiencia.</h2><p class="dialog-desc">${escapeHtml(item.name)} · ${dateLabel(item.start)} en ${escapeHtml(item.location)}</p><div class="dialog-details"><div>Inversión<strong>${money(item.price)}</strong></div><div>Disponibilidad<strong>${escapeHtml(item.status)}</strong></div></div><label class="toggle-row"><span><strong>¿Vas con acompañantes?</strong><small>Podés registrar sus nombres para esta demo.</small></span><input id="enroll-has-guests" type="checkbox"><i class="switch"></i></label><div id="enroll-guest-fields" class="enroll-guests hidden"><label>Nombre/s de acompañantes<input id="enroll-guest-names" placeholder="Ej. Alex Pérez, Sam Díaz"></label></div><div id="enroll-summary" class="summary-box hidden"></div><button class="button primary dialog-confirm" id="confirm-enroll">Ver resumen <span>→</span></button>`;
  document.querySelector('#enroll-dialog').showModal();
  document.querySelector('#enroll-has-guests').addEventListener('change', e => document.querySelector('#enroll-guest-fields').classList.toggle('hidden', !e.target.checked));
  document.querySelector('#confirm-enroll').addEventListener('click', previewEnrollment);
}
function previewEnrollment() {
  const item = retreats.find(entry => entry.id === selectedEnroll); if (!item) return;
  const hasGuests = document.querySelector('#enroll-has-guests').checked;
  const names = hasGuests ? document.querySelector('#enroll-guest-names').value.split(',').map(name => name.trim()).filter(Boolean) : [];
  if (hasGuests && !names.length) { showToast('Ingresá al menos un nombre de acompañante.'); return; }
  const summary = document.querySelector('#enroll-summary');
  summary.innerHTML = `<h3>Resumen de inscripción</h3><div class="summary-line"><span class="summary-label">Retiro</span><strong>${escapeHtml(item.name)}</strong></div><div class="summary-line"><span class="summary-label">Participación</span><span>Inscripta · Pago pendiente</span></div><div class="summary-line"><span class="summary-label">Acompañantes</span><span>${names.length ? names.map(escapeHtml).join(', ') : 'Sin acompañantes'}</span></div><div class="summary-line"><strong>Inversión</strong><strong>${money(item.price)}</strong></div>`;
  summary.classList.remove('hidden');
  const button = document.querySelector('#confirm-enroll'); button.innerHTML = 'Confirmar inscripción <span>✓</span>'; button.removeEventListener('click', previewEnrollment); button.addEventListener('click', confirmEnrollment);
}
function confirmEnrollment() {
  const item = retreats.find(entry => entry.id === selectedEnroll); if (!item) return;
  if (item.status !== 'Disponible' || item.enrolled) { document.querySelector('#enroll-dialog').close(); showToast('Este retiro ya no está disponible para inscripción.'); renderAvailable(); return; }
  const hasGuests = document.querySelector('#enroll-has-guests').checked;
  const names = hasGuests ? document.querySelector('#enroll-guest-names').value.split(',').map(name => name.trim()).filter(Boolean) : [];
  if (hasGuests && !names.length) { showToast('Ingresá al menos un nombre de acompañante.'); return; }
  item.enrolled = true; item.participation = 'Inscripta'; item.payment = 'Pendiente de pago'; item.guests = names.map(name => ({ name, relation: 'Acompañante' }));
  save(); document.querySelector('#enroll-dialog').close(); showToast('¡Inscripción confirmada! Ya está en tu agenda.'); renderAvailable();
}
document.querySelectorAll('.detail-dialog .dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('.detail-dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
renderAvailable();
