import {
  X,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  CreditCard as CardIcon,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CreditCard, Transaction } from "../types";
import { formatCurrency } from "../helpers/currency-formater";
import { format, isFuture, isPast, parseISO, startOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreditCardDetailModalProps {
  card: CreditCard;
  onClose: () => void;
}

interface InvoiceSummary {
  month: string; // "yyyy-MM"
  total: number;
  paid: number;
  open: number;
  isPaid: boolean;
  status: "future" | "current" | "past";
}

export function CreditCardDetailModal({
  card,
  onClose,
}: CreditCardDetailModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("credit_card_id", card.id)
        .order("due_date", { ascending: false });

      if (data) {
        setTransactions(data);

        const grouped: Record<string, InvoiceSummary> = {};
        const today = new Date();
        const currentMonthStart = startOfMonth(today);

        data.forEach((t) => {
          const monthKey = t.due_date.substring(0, 7); // "yyyy-MM"
          if (!grouped[monthKey]) {
            const dueDate = parseISO(t.due_date);
            const invoiceMonthStart = startOfMonth(dueDate);
            
            let status: "future" | "current" | "past" = "current";
            if (isSameMonth(invoiceMonthStart, currentMonthStart)) {
              status = "current";
            } else if (invoiceMonthStart > currentMonthStart) {
              status = "future";
            } else {
              status = "past";
            }

            grouped[monthKey] = {
              month: monthKey,
              total: 0,
              paid: 0,
              open: 0,
              isPaid: false,
              status,
            };
          }
          grouped[monthKey].total += t.amount;
          if (t.is_paid) {
            grouped[monthKey].paid += t.amount;
          } else {
            grouped[monthKey].open += t.amount;
          }
        });

        const invoiceList = Object.values(grouped)
          .map((inv) => ({
            ...inv,
            isPaid: inv.open === 0 && inv.total > 0,
          }))
          .sort((a, b) => b.month.localeCompare(a.month));

        setInvoices(invoiceList);
      }
      setLoading(false);
    }

    fetchTransactions();
  }, [card.id]);

  const stats = {
    totalInvoices: invoices.length,
    futureValue: invoices
      .filter((i) => i.status === "future")
      .reduce((acc, i) => acc + i.open, 0),
    currentValue: invoices
      .filter((i) => i.status === "current")
      .reduce((acc, i) => acc + i.open, 0),
    pastValue: invoices
      .filter((i) => i.status === "past")
      .reduce((acc, i) => acc + i.open, 0),
    paidInvoicesCount: invoices.filter((i) => i.isPaid).length,
    openInvoicesCount: invoices.filter((i) => !i.isPaid).length,
    totalDebt: invoices.reduce((acc, i) => acc + i.open, 0),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      ></div>
      <div className="relative bg-[#020617] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-6">
            <div
              className="w-16 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-inner"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              <CardIcon size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {card.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Detalhamento Completo do Cartão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff632a]"></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Carregando histórico...
              </p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Total de Faturas
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalInvoices}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {stats.paidInvoicesCount} Pagas
                    </span>
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {stats.openInvoicesCount} Abertas
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Faturas Passadas
                  </p>
                  <p className="text-2xl font-bold text-rose-400">
                    {formatCurrency(stats.pastValue)}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase">
                    Total em aberto
                  </p>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 border-l-[#ff632a]/30 border-l-2">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Fatura Atual
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stats.currentValue)}
                  </p>
                  <p className="text-[9px] font-bold text-[#ff632a] mt-1 uppercase">
                    Vence este mês
                  </p>
                </div>

                <div className="bg-[#ff632a]/10 p-6 rounded-3xl border border-[#ff632a]/20">
                  <p className="text-[9px] font-bold text-[#ff632a] uppercase tracking-widest mb-2">
                    Faturas Futuras
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stats.futureValue)}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                    <Clock size={10} />
                    Projeção de Gastos
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    Cronograma de Faturas
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Ordenado por Recência
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {invoices.map((inv) => (
                    <div
                      key={inv.month}
                      className={`group flex items-center justify-between p-6 rounded-3xl border transition-all hover:scale-[1.01] ${
                        inv.status === "current"
                          ? "bg-white/10 border-white/20 shadow-xl"
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${
                          inv.isPaid 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : inv.status === 'future' 
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {inv.isPaid ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white capitalize leading-none mb-1">
                            {format(parseISO(inv.month + "-01"), "MMMM yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {inv.status === "current" ? "Fatura Atual" : inv.status === "future" ? "Fatura Futura" : "Fatura Passada"}
                            </span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${inv.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {inv.isPaid ? 'Pago' : 'Em Aberto'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Valor Total
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(inv.total)}
                          </p>
                        </div>
                        
                        {!inv.isPaid && inv.paid > 0 && (
                           <div className="text-right pr-6 border-r border-white/5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-emerald-500">
                              Pago
                            </p>
                            <p className="text-sm font-bold text-emerald-500">
                              {formatCurrency(inv.paid)}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col items-center">
                           <div className={`p-2 rounded-lg transition-colors ${inv.status === 'current' ? 'bg-[#ff632a] text-white' : 'bg-white/5 text-slate-500 group-hover:text-white'}`}>
                            <ArrowUpRight size={18} />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                    <TrendingDown size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Dívida Total Acumulada no Cartão</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.totalDebt)}</p>
                </div>
            </div>
            
            <button 
                onClick={onClose}
                className="px-10 py-4 bg-white text-black rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff632a] hover:text-white transition-all active:scale-95"
            >
                Fechar Detalhes
            </button>
        </div>
      </div>
    </div>
  );
}
