import { STORAGE_KEY, dateKey, validateData, duration, currentPeriod, periodDates } from './model.mjs?v=2';
const $ = selector => document.querySelector(selector);
const now = new Date();
let { year, month } = currentPeriod(now);
let data = { version: 1, shifts: {} }, selected = new Set(), storageReady = true;
const names = { early: '早番', late: '遅番', off: '休み', free: 'Free', custom: 'シフト' };
const presets = { early: {kind:'early',start:'09:30',end:'19:00'}, late: {kind:'late',start:'11:00',end:'20:45'}, off: {kind:'off',start:'',end:''}, free: {kind:'free',start:'',end:''} };
function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) data = validateData(JSON.parse(saved));
} catch {
  storageReady = false;
  status('保存データを読み込めませんでした。既存データ保護のため編集を停止しました。別のブラウザを使うか、バックアップを読み込んでください。', true);
}
function persist(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); data = next; return true; }
  catch { status('保存できませんでした。ブラウザの保存設定や空き容量を確認してください。変更は適用されていません。', true); return false; }
}
function renderSelection() {
  $('#selection').textContent = `${selected.size}日選択中`;
  $('#selection-help').textContent = selected.size ? '選択した日にまとめて入力' : '日付を複数選べます';
  document.querySelectorAll('[data-preset],#custom button,#clear').forEach(b => b.disabled = !selected.size || !storageReady);
  $('#deselect').disabled = !selected.size;
}
function render() {
  const dates = periodDates(year, month);
  const [endYear, endMonth] = dates.at(-1).split('-').map(Number);
  $('#year').textContent = `${year}年${month + 1}月11日 〜 ${endYear !== year ? endYear + '年' : ''}${endMonth}月10日`;
  $('#month').textContent = 'シフト入力';
  $('#month-picker').value = `${year}-${String(month + 1).padStart(2,'0')}`;
  $('#month-picker').min = '1900-01'; $('#month-picker').max = '9999-11';
  $('#prev').disabled = year === 1900 && month === 0;
  $('#next').disabled = year === 9999 && month === 10;
  const days = $('#days'); days.replaceChildren();
  const offset = new Date(year, month, 11).getDay(), count = dates.length;
  const total = Math.ceil((offset + count) / 7) * 7;
  let work = 0, minutes = 0, off = 0;
  for (let slot = 0; slot < total; slot++) {
    const index = slot - offset;
    if (index < 0 || index >= count) { const blank = document.createElement('div'); blank.className = 'empty'; blank.setAttribute('aria-hidden','true'); days.append(blank); continue; }
    const key = dates[index], shift = data.shifts[key];
    const [dateYear, dateMonth, day] = key.split('-').map(Number);
    if (shift) { if (shift.kind === 'off') off++; else work++; minutes += duration(shift); }
    const button = document.createElement('button'); button.type = 'button'; button.className = 'day';
    if (slot % 7 === 0) button.classList.add('sun'); if (slot % 7 === 6) button.classList.add('sat');
    if (key === dateKey(now.getFullYear(),now.getMonth(),now.getDate())) button.classList.add('today');
    button.setAttribute('aria-pressed', String(selected.has(key)));
    button.setAttribute('aria-label', `${dateYear}年${dateMonth}月${day}日、${shift ? names[shift.kind] + (shift.start ? ` ${shift.start}から${shift.end}${shift.end < shift.start ? '（翌日）' : ''}` : '') : '未入力'}`);
    const number = document.createElement('span'); number.className = 'date'; number.textContent = index === 0 || day === 1 ? `${dateMonth}/${day}` : day; button.append(number);
    if (index === 0 || day === 1) button.classList.add('month-start');
    if (shift) {
      button.dataset.kind = shift.kind;
      const label = document.createElement('span'); label.className = 'shift-label'; label.textContent = names[shift.kind]; button.append(label);
      if (shift.start) { const time = document.createElement('span'); time.className = 'shift-time'; time.textContent = `${shift.start}\n${shift.end}${shift.end < shift.start ? '翌' : ''}`; button.append(time); }
    }
    button.addEventListener('click', () => {
      selected.has(key) ? selected.delete(key) : selected.add(key);
      button.setAttribute('aria-pressed', String(selected.has(key))); renderSelection();
      if (selected.has(key)) setSheet(false);
    }); days.append(button);
  }
  $('#summary').textContent = `出勤 ${work}日 · 休み ${off}日 · ${Math.round(minutes / 60 * 10) / 10}h（休憩除外前）`;
  renderSelection();
}
function move(delta) {
  const next = new Date(year, month + delta, 1);
  if (next.getFullYear() < 1900 || next.getFullYear() > 9999 || (next.getFullYear() === 9999 && next.getMonth() > 10)) return;
  year = next.getFullYear(); month = next.getMonth(); selected.clear(); render();
}
function apply(shift) {
  if (!selected.size || !storageReady) return;
  const next = {version:1, shifts:{...data.shifts}};
  for (const key of selected) { if (shift) next.shifts[key] = {...shift}; else delete next.shifts[key]; }
  const count = selected.size;
  if (persist(next)) { render(); status(`${count}日分の${shift ? 'シフトを保存' : '入力を削除'}しました。`); }
}
$('#prev').addEventListener('click', () => move(-1)); $('#next').addEventListener('click', () => move(1));
$('#today').addEventListener('click', () => { ({year, month} = currentPeriod(new Date())); selected.clear(); render(); });
$('#month-picker').addEventListener('change', e => { const match = /^(\d{4})-(\d{2})$/.exec(e.target.value); if (!match || +match[1] < 1900 || +match[1] > 9999 || +match[2] < 1 || +match[2] > 12 || (+match[1] === 9999 && +match[2] === 12)) return; year = +match[1]; month = +match[2]-1; selected.clear(); render(); });
$('#deselect').addEventListener('click', () => { selected.clear(); render(); });
$('#select-all').addEventListener('click', () => { for (const key of periodDates(year,month)) selected.add(key); render(); setSheet(false); });
document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => apply(presets[b.dataset.preset])));
$('#custom').addEventListener('submit', e => { e.preventDefault(); const start = $('#start').value, end = $('#end').value; if (!start || !end || start === end) { status('開始と終了には異なる時刻を指定してください。',true); return; } apply({kind:'custom',start,end}); });
$('#clear').addEventListener('click', () => { if (confirm(`選択した${selected.size}日分の入力を消しますか？`)) apply(null); });
function download(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
$('#export').addEventListener('click', () => {
  if (!storageReady) { status('保存データを読み込めていないため、書き出しできません。',true); return; }
  download(new Blob([JSON.stringify({...data, exportedAt: new Date().toISOString()},null,2)], {type:'application/json'}), `shiftmaker-${dateKey(now.getFullYear(),now.getMonth(),now.getDate())}.json`);
  status('バックアップを書き出しました。');
});
$('#import').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('ファイルは5MB以下にしてください。');
    const restored = validateData(JSON.parse(await file.text()));
    if (!confirm(`${Object.keys(restored.shifts).length}日分のバックアップを読み込みます。現在のすべての入力を置き換えますか？`)) return;
    if (persist(restored)) { storageReady = true; selected.clear(); render(); status('バックアップを読み込みました。'); }
  } catch (error) { status(`読み込めませんでした。${error instanceof SyntaxError ? 'JSONファイルの形式を確認してください。' : error.message}`,true); }
  finally { e.target.value = ''; }
});
render();

function setSheet(collapsed) {
  $('#control-pane').classList.toggle('collapsed', collapsed);
  $('#sheet-toggle').setAttribute('aria-expanded', String(!collapsed));
  $('.sheet-label').textContent = collapsed ? '入力パネルを開く' : '入力パネルを閉じる';
}
$('#sheet-toggle').addEventListener('click', () => setSheet(!$('#control-pane').classList.contains('collapsed')));
const wideScreen = matchMedia('(min-width: 1025px)');
function syncCustomPanel() { $('.custom-section').open = wideScreen.matches; if (wideScreen.matches) setSheet(false); }
wideScreen.addEventListener('change', syncCustomPanel);
syncCustomPanel();
