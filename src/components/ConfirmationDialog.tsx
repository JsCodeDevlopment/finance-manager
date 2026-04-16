import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-rose-500" size={32} />,
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          button: 'bg-rose-500 hover:bg-rose-600 text-white'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="text-emerald-500" size={32} />,
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          button: 'bg-emerald-500 hover:bg-emerald-600 text-white'
        };
      case 'info':
        return {
          icon: <Info className="text-blue-500" size={32} />,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          button: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
      default:
        return {
          icon: <AlertTriangle className="text-amber-500" size={32} />,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          button: 'bg-[#ff632a] hover:bg-[#ff7b4d] text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#020617] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`${styles.bg} ${styles.border} w-16 h-16 rounded-2xl flex items-center justify-center border`}>
            {styles.icon}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-4 ${styles.button} rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg`}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
