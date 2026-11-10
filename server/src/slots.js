// Cálculo de horarios libres de la agenda (lógica pura, sin base de datos, para poder probarla)

export const SLOT_MIN = 60;

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {string} dateStr  'YYYY-MM-DD'
 * @param {{start_time:string,end_time:string}[]} rules  franjas activas del día ('HH:MM' o 'HH:MM:SS')
 * @param {Set<string>|string[]} taken  horas ya ocupadas ('HH:MM')
 * @param {Date} now  se descartan los horarios que ya pasaron
 * @returns {string[]} horas libres ('HH:MM'), ordenadas y sin repetidos
 */
export function buildSlots(dateStr, rules, taken = [], now = new Date(), slotMin = SLOT_MIN) {
  const takenSet = taken instanceof Set ? taken : new Set(taken);
  const out = new Set();
  for (const rule of rules) {
    const [sh, sm] = rule.start_time.split(':').map(Number);
    const [eh, em] = rule.end_time.split(':').map(Number);
    for (let m = sh * 60 + sm; m + slotMin <= eh * 60 + em; m += slotMin) {
      const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      if (new Date(`${dateStr}T${t}:00`) > now && !takenSet.has(t)) out.add(t);
    }
  }
  return [...out].sort();
}
