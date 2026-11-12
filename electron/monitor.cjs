// Misure leggere per la barra: CPU e RAM. Nessuna rete, nessun dato salvato.
const os = require('os');

function cpuTimes() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) { for (const v of Object.values(c.times)) total += v; idle += c.times.idle; }
  return { idle, total };
}
/** Percentuale di CPU usata tra due letture di cpuTimes(). */
function cpuPercent(prev, cur) {
  const dt = cur.total - prev.total; if (dt <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - (cur.idle - prev.idle) / dt))));
}
function ramPercent() { return Math.round(100 * (1 - os.freemem() / os.totalmem())); }
function tooltip(cpu, ram) { return `Bibo Tune — CPU ${cpu}% · RAM ${ram}%`; }
/** Dice se il PC è "in affanno": serve a colorare/avvisare, soglia unica e semplice. */
function pressure(cpu, ram) { return ram >= 90 ? 'ram' : cpu >= 95 ? 'cpu' : null; }

module.exports = { cpuTimes, cpuPercent, ramPercent, tooltip, pressure };
