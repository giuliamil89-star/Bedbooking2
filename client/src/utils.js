export function todayStr() {
  const d = new Date();
  return toLocalDateStr(d);
}

export function toLocalDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function isToday(dateStr) {
  return dateStr === todayStr();
}

export function isTomorrow(dateStr) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateStr === toLocalDateStr(d);
}
