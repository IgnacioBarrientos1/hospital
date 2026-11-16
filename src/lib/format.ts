const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatTime(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')} hs`;
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visibleName = name.slice(0, 2);
  return `${visibleName}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`;
}

export function fullName(p?: { first_name: string; last_name: string } | null): string {
  if (!p) return '—';
  return `${p.first_name} ${p.last_name}`.trim();
}
