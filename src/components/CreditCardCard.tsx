import {
  AlertCircle,
  Calendar,
  CreditCard as CardIcon,
  Trash2,
  TrendingUp,
  Edit2,
} from "lucide-react";
import { formatCurrency } from "../helpers/currency-formater";
import { CreditCard } from "../types";

interface CreditCardCardProps {
  card: CreditCard;
  onDelete: (id: string) => void;
  onEdit: (card: CreditCard) => void;
  onPayBill: (id: string) => void;
  onClick: () => void;
}

export function CreditCardCard({ card, onDelete, onEdit, onPayBill, onClick }: CreditCardCardProps) {
  const usagePercentage =
    card.limit_amount > 0
      ? ((card.total_debt || 0) / card.limit_amount) * 100
      : 0;

  const isHighUsage = usagePercentage > 80;

  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl cursor-pointer active:scale-[0.98]"
    >
      {/* Visual Identity Strip */}
      <div
        className="absolute top-0 left-0 w-full h-1.5 opacity-50 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: card.color }}
      ></div>

      <div className="p-10 relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              <CardIcon size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">
                {card.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                **** **** **** {card.last_4 || "0000"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="p-3 text-slate-600 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex justify-between items-center group/stat">
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest mb-1.5">
                  Fatura do Mês
                </p>
                <p className="text-xl font-bold text-white tracking-tight">
                  {formatCurrency(card.current_bill || 0)}
                </p>
              </div>
              
              {card.current_bill && card.current_bill > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayBill(card.id);
                  }}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg border border-emerald-500/20 transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  Liquidar Fatura
                </button>
              ) : (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest mb-1.5">
                    Total Devedor
                  </p>
                  <p className="text-sm font-bold text-slate-400 tracking-tight">
                    {formatCurrency(card.total_debt || 0)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold uppercase text-emerald-600/70 tracking-widest mb-1.5">
                  Limite Disponível Livre
                </p>
                <p className="text-xl font-bold text-emerald-400 tracking-tight">
                  {formatCurrency(card.available_limit || card.limit_amount)}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Uso do Limite
                </p>
                {isHighUsage && (
                  <AlertCircle
                    size={12}
                    className="text-amber-500 animate-pulse"
                  />
                )}
              </div>
              <p
                className={`text-[10px] font-black font-mono ${isHighUsage ? "text-amber-500" : "text-slate-400"}`}
              >
                {usagePercentage.toFixed(0)}%
              </p>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(usagePercentage, 100)}%`,
                  backgroundColor: isHighUsage ? "#f59e0b" : card.color,
                }}
              ></div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                  Fecha dia
                </span>
                <div className="flex items-center gap-1.5 text-white/90 font-bold text-xs">
                  <Calendar size={12} className="text-slate-500" />
                  {card.closing_day}
                </div>
              </div>
              <div className="w-px h-6 bg-white/5"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                  Vence dia
                </span>
                <div className="flex items-center gap-1.5 text-white/90 font-bold text-xs">
                  <TrendingUp size={12} className="text-slate-500" />
                  {card.due_day}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
                Limite Total
              </p>
              <p className="text-sm font-bold text-white/50">
                {formatCurrency(card.limit_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div
        className="absolute -bottom-10 -right-10 w-40 h-40 opacity-5 blur-[60px] rounded-full group-hover:opacity-10 transition-opacity duration-1000"
        style={{ backgroundColor: card.color }}
      ></div>
    </div>
  );
}
