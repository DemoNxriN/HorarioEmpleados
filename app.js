const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const SHIFTS = {
  '':   'Sin asignar',
  'M':  'Mañana',
  'T':  'Tarde',
  'MT': 'Mañana y tarde',
  'L':  'Libre'
};

const DEFAULT_TIMES = {
  'M':  ['06:30', '13:00', '', ''],
  'T':  ['13:00', '21:00', '', ''],
  'MT': ['06:30', '13:00', '13:00', '21:00'],
  'L':  ['', '', '', ''],
  '':   ['', '', '', '']
};

const COLORS = [
  { bg: '#ddeeff', text: '#0c3d6e' },
  { bg: '#ffe4d6', text: '#7a2800' },
  { bg: '#e8e2ff', text: '#3b1a8f' },
  { bg: '#d8f5e4', text: '#0e4d28' },
  { bg: '#fff0cc', text: '#6b4500' },
  { bg: '#fce4f0', text: '#7a1048' },
  { bg: '#d6f5f0', text: '#0a4d3f' }
];

let employees  = [];
let schedule   = {};
let weekOffset = 0;

/* ── Date helpers ── */

function getMonday(offset = 0) {
  const d   = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function weekKey(offset) {
  return getMonday(offset).toISOString().slice(0, 10);
}

function updateWeekLabel() {
  const mon = getMonday(weekOffset);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  document.getElementById('week-label').textContent =
    formatDate(mon) + ' – ' + formatDate(sun);
}

function changeWeek(dir) {
  weekOffset += dir;
  updateWeekLabel();
  render();
}

/* ── Employee management ── */

function addEmployee() {
  const input = document.getElementById('emp-input');
  const name  = input.value.trim();
  if (!name) return;
  const id = Date.now().toString();
  employees.push({ id, name });
  schedule[id] = {};
  input.value  = '';
  render();
}

function removeEmployee(id) {
  employees = employees.filter(e => e.id !== id);
  delete schedule[id];
  render();
}

/* ── Schedule data ── */

function getEntry(empId, dayIdx) {
  const wk = weekKey(weekOffset);
  return (schedule[empId][wk] || {})[dayIdx] || { shift: '', start: '', end: '', start2: '', end2: '' };
}

function setEntry(empId, dayIdx, field, val) {
  const wk = weekKey(weekOffset);
  if (!schedule[empId][wk]) schedule[empId][wk] = {};
  if (!schedule[empId][wk][dayIdx]) schedule[empId][wk][dayIdx] = { shift: '', start: '', end: '', start2: '', end2: '' };
  schedule[empId][wk][dayIdx][field] = val;
}

/* ── UI helpers ── */

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function bgClass(v) {
  if (v === 'M')  return 'ci-m';
  if (v === 'T')  return 'ci-t';
  if (v === 'MT') return 'ci-mt';
  if (v === 'L')  return 'ci-l';
  return 'ci-x';
}

/* ── Event handlers ── */

function onShiftChange(empId, dayIdx, selectEl) {
  const val      = selectEl.value;
  const defaults = DEFAULT_TIMES[val] || ['', '', '', ''];
  const cur      = getEntry(empId, dayIdx);

  setEntry(empId, dayIdx, 'shift', val);
  if (!cur.start)  setEntry(empId, dayIdx, 'start',  defaults[0]);
  if (!cur.end)    setEntry(empId, dayIdx, 'end',    defaults[1]);
  if (!cur.start2) setEntry(empId, dayIdx, 'start2', defaults[2]);
  if (!cur.end2)   setEntry(empId, dayIdx, 'end2',   defaults[3]);

  const cellInner  = selectEl.closest('.cell-inner');
  cellInner.className = 'cell-inner ' + bgClass(val);

  const entry    = getEntry(empId, dayIdx);
  const timeRow  = cellInner.querySelector('.time-row');
  const timeRow2 = cellInner.querySelector('.time-row2');

  if (val === '' || val === 'L') {
    timeRow.classList.add('hidden');
    timeRow2.classList.add('hidden');
  } else if (val === 'MT') {
    timeRow.classList.remove('hidden');
    timeRow2.classList.remove('hidden');
    const [sEl, eEl] = timeRow.querySelectorAll('input[type=time]');
    sEl.value = entry.start  || defaults[0];
    eEl.value = entry.end    || defaults[1];
    const [sEl2, eEl2] = timeRow2.querySelectorAll('input[type=time]');
    sEl2.value = entry.start2 || defaults[2];
    eEl2.value = entry.end2   || defaults[3];
  } else {
    timeRow.classList.remove('hidden');
    timeRow2.classList.add('hidden');
    const [sEl, eEl] = timeRow.querySelectorAll('input[type=time]');
    sEl.value = entry.start || defaults[0];
    eEl.value = entry.end   || defaults[1];
  }
}

function onTimeChange(empId, dayIdx, field, val) {
  setEntry(empId, dayIdx, field, val);
}

/* ── Render ── */

function render() {
  const wrap = document.getElementById('calendar-wrap');

  if (employees.length === 0) {
    wrap.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📅</div>
        <p>Añade empleados para empezar a gestionar los turnos</p>
      </div>`;
    return;
  }

  const mon   = getMonday(weekOffset);
  const dates = DAYS.map((_, i) => {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    return d;
  });

  let html = '<div class="table-scroll"><table><thead><tr><th>Empleado</th>';

  DAYS.forEach((d, i) => {
    const weekend = i >= 5 ? ' class="is-weekend"' : '';
    html += `<th${weekend}>
      <span class="day-num">${dates[i].getDate()}</span>
      ${d}
    </th>`;
  });

  html += '</tr></thead><tbody>';

  employees.forEach((emp, ei) => {
    const color = COLORS[ei % COLORS.length];
    html += `<tr>
      <td><div class="emp-cell">
        <div class="avatar" style="background:${color.bg};color:${color.text}">${initials(emp.name)}</div>
        <span class="emp-name-text">${emp.name}</span>
        <button class="btn-del" onclick="removeEmployee('${emp.id}')" title="Eliminar">✕</button>
      </div></td>`;

    DAYS.forEach((_, di) => {
      const entry     = getEntry(emp.id, di);
      const s         = entry.shift || '';
      const bg        = bgClass(s);
      const showTime  = s === 'M' || s === 'T' || s === 'MT';
      const showTime2 = s === 'MT';
      const d         = DEFAULT_TIMES[s] || ['','','',''];
      const startVal  = entry.start  || d[0];
      const endVal    = entry.end    || d[1];
      const start2Val = entry.start2 || d[2];
      const end2Val   = entry.end2   || d[3];
      const weekend   = di >= 5 ? ' is-weekend' : '';

      html += `<td class="day-cell${weekend}">
        <div class="cell-inner ${bg}">
          <select class="shift-sel" onchange="onShiftChange('${emp.id}',${di},this)">
            ${Object.entries(SHIFTS).map(([k, label]) =>
              `<option value="${k}" ${s === k ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
          <div class="time-row ${showTime ? '' : 'hidden'}">
            <input type="time" value="${startVal}"
                   onchange="onTimeChange('${emp.id}',${di},'start',this.value)" />
            <span class="time-sep">–</span>
            <input type="time" value="${endVal}"
                   onchange="onTimeChange('${emp.id}',${di},'end',this.value)" />
          </div>
          <div class="time-row time-row2 ${showTime2 ? '' : 'hidden'}">
            <input type="time" value="${start2Val}"
                   onchange="onTimeChange('${emp.id}',${di},'start2',this.value)" />
            <span class="time-sep">–</span>
            <input type="time" value="${end2Val}"
                   onchange="onTimeChange('${emp.id}',${di},'end2',this.value)" />
          </div>
        </div>
      </td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

/* ── Save as image ── */

function saveImage() {
  const btn      = document.querySelector('.btn-save');
  const original = btn.innerHTML;
  btn.innerHTML  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Generando...</span>';
  btn.disabled   = true;

  const source = document.getElementById('app');
  const table  = source.querySelector('table');
  const fullW  = table ? Math.max(table.scrollWidth, source.scrollWidth) : source.scrollWidth;

  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-99999px',
    'width:' + fullW + 'px',
    'background:#f7f6fb',
    'z-index:-1'
  ].join(';');

  const clone = source.cloneNode(true);
  clone.style.overflow = 'visible';
  clone.style.width    = fullW + 'px';

  clone.querySelectorAll('*').forEach(el => {
    el.style.overflow = 'visible';
    el.style.maxWidth = 'none';
  });

  const addRow = clone.querySelector('.add-row');
  if (addRow) addRow.style.display = 'none';
  clone.querySelectorAll('.btn-del').forEach(b => b.style.display = 'none');

  // Replace selects with static divs
  const realSelects  = source.querySelectorAll('select.shift-sel');
  const cloneSelects = clone.querySelectorAll('select.shift-sel');
  const colorMap     = { M: '#0c3d6e', T: '#6b4500', MT: '#4a2070', L: '#0e4d28', '': '#3a3958' };
  cloneSelects.forEach((sel, i) => {
    const val   = realSelects[i] ? realSelects[i].value : sel.value;
    const label = SHIFTS[val] || 'Sin asignar';
    const div   = document.createElement('div');
    div.textContent  = label;
    div.style.cssText = 'text-align:center;font-family:DM Sans,sans-serif;font-size:13px;font-weight:700;color:' + (colorMap[val] || '#3a3958') + ';padding:5px 4px;width:100%';
    sel.replaceWith(div);
  });

  // Replace time rows with static spans
  const timeStyle = 'background:rgba(255,255,255,0.85);border:1px solid rgba(0,0,0,0.12);border-radius:4px;padding:4px 8px;font-family:DM Sans,sans-serif;font-size:12px;font-weight:600;color:#1a1840;min-width:58px;text-align:center;display:inline-block';
  const sepStyle  = 'font-size:11px;color:#6e6c8a;font-weight:500';
  const rowStyle  = 'display:flex;align-items:center;justify-content:center;gap:6px;padding:2px 0';

  // All time inputs in source (visible ones only, matched by index to clone)
  const realInputPairs  = [...source.querySelectorAll('.time-row:not(.hidden), .time-row2:not(.hidden)')];
  const cloneAllRows    = [...clone.querySelectorAll('.time-row, .time-row2')];

  // Build a map: for each real visible row, get its input values
  let realIdx = 0;
  cloneAllRows.forEach(row => {
    const isHidden = row.classList.contains('hidden');
    if (isHidden) { row.style.display = 'none'; return; }

    const realRow = realInputPairs[realIdx++];
    const [sEl, eEl] = realRow ? realRow.querySelectorAll('input[type=time]') : [];
    const sVal = sEl ? sEl.value : '';
    const eVal = eEl ? eEl.value : '';

    const div = document.createElement('div');
    div.style.cssText = rowStyle;
    div.innerHTML = `<span style="${timeStyle}">${sVal}</span><span style="${sepStyle}">–</span><span style="${timeStyle}">${eVal}</span>`;
    row.replaceWith(div);
  });

  container.appendChild(clone);
  document.body.appendChild(container);

  const mon      = getMonday(weekOffset);
  const sun      = new Date(mon); sun.setDate(sun.getDate() + 6);
  const meses    = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const fileName = `horario_${mon.getDate()}-${sun.getDate()}_${meses[sun.getMonth()]}_${sun.getFullYear()}.png`;

  html2canvas(clone, {
    scale:        2,
    backgroundColor: '#f7f6fb',
    useCORS:      true,
    scrollX:      0,
    scrollY:      0,
    width:        fullW,
    height:       clone.scrollHeight,
    windowWidth:  fullW,
    windowHeight: clone.scrollHeight,
    logging:      false
  }).then(canvas => {
    document.body.removeChild(container);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px';

      const msg = document.createElement('p');
      msg.textContent = 'Mantén pulsada la imagen y elige "Guardar imagen"';
      msg.style.cssText = 'color:#fff;font-family:DM Sans,sans-serif;font-size:15px;text-align:center;max-width:280px;line-height:1.5';

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.style.cssText = 'max-width:100%;max-height:65vh;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.4)';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Cerrar';
      closeBtn.style.cssText = 'padding:10px 28px;background:#fff;color:#1a1840;border:none;border-radius:8px;font-family:DM Sans,sans-serif;font-size:14px;font-weight:600;cursor:pointer';
      closeBtn.onclick = () => document.body.removeChild(overlay);

      overlay.appendChild(msg);
      overlay.appendChild(img);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);
    } else {
      const link    = document.createElement('a');
      link.download = fileName;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    }

    btn.innerHTML = original;
    btn.disabled  = false;
  }).catch(err => {
    console.error(err);
    document.body.removeChild(container);
    btn.innerHTML = original;
    btn.disabled  = false;
  });
}

/* ── Init ── */
updateWeekLabel();
render();