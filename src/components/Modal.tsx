import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, title, subtitle, onClose, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hmg-deep/40 backdrop-blur-sm animate-overlay-in" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} animate-scale-in`}>
        <div className="card overflow-hidden">
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="btn-ghost -mr-2 -mt-1" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
          {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
