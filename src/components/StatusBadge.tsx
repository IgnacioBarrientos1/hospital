interface Props {
  status: 'pending' | 'confirmed' | 'cancelled';
  size?: 'sm' | 'md';
}

const MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelled: { label: 'Cancelado', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const s = MAP[status] ?? MAP.pending;
  return (
    <span className={`badge ring-1 ring-inset ${s.cls} ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'confirmed' ? 'bg-emerald-500' : status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'}`} />
      {s.label}
    </span>
  );
}
