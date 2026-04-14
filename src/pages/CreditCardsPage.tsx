import {
  AlertTriangle,
  CreditCard as CardIcon,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreditCardCard } from "../components/CreditCardCard";
import { CreditCardForm } from "../components/CreditCardForm";
import { CreditCardDetailModal } from "../components/CreditCardDetailModal";
import { formatCurrency } from "../helpers/currency-formater";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { CreditCard, Transaction } from "../types";

export function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalLimit: 0,
    totalDebt: 0,
    availableLimit: 0,
  });
  const [detailedCard, setDetailedCard] = useState<CreditCard | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch Cards
    const { data: cardsData } = await supabase
      .from("credit_cards")
      .select("*")
      .order("name");

    if (cardsData) {
      // Fetch all transactions linked to cards to calculate debt
      // Note: We fetch all because a card debt might be across months
      const { data: transData } = await supabase
        .from("transactions")
        .select("*")
        .not("credit_card_id", "is", null)
        .eq("is_paid", false);

      const currentMonth = format(new Date(), "yyyy-MM");

      const cardsWithDebt = cardsData.map((card: CreditCard) => {
        const cardTransactions = transData?.filter((t: Transaction) => t.credit_card_id === card.id) || [];
        
        const totalDebt = cardTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const currentBill = cardTransactions
          .filter((t: Transaction) => t.due_date.startsWith(currentMonth))
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        return {
          ...card,
          total_debt: totalDebt,
          current_bill: currentBill,
          available_limit: card.limit_amount - totalDebt,
        };
      });

      setCards(cardsWithDebt);

      // Calculate Summary (Total committed across all cards)
      const totalLimit = cardsWithDebt.reduce((s, c) => s + c.limit_amount, 0);
      const totalDebtCommitted = cardsWithDebt.reduce(
        (s, c) => s + (c.total_debt || 0),
        0,
      );

      setSummary({
        totalLimit,
        totalDebt: totalDebtCommitted,
        availableLimit: totalLimit - totalDebtCommitted,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteCard = async (id: string) => {
    if (
      !window.confirm(
        "Isso removerá o cartão, mas as transações vinculadas permanecerão. Continuar?",
      )
    )
      return;

    const { error } = await supabase.from("credit_cards").delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 relative">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Gesto de <span className="text-slate-500 italic">Crédito</span>
          </h1>
          <p className="text-slate-400 font-bold flex items-center gap-2 ml-1 text-sm tracking-tight">
            <Sparkles size={16} className="text-[#ff632a]" />
            Visão consolidada de faturas, limites e parcelamentos ativos.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="group flex items-center justify-center gap-3 px-10 py-5 bg-[#ff632a] text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-orange-500/20 transition-all border border-orange-400/20 active:scale-95 text-[10px] uppercase tracking-widest"
        >
          <Plus
            size={18}
            className="group-hover:scale-125 transition-transform"
          />
          <span>Cadastrar Novo Cartão</span>
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden group">
          <div className="p-3 bg-white/5 border border-white/10 text-slate-400 w-fit rounded-xl mb-12">
            <Wallet size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Total de Crédito Disponível
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(summary.totalLimit)}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit rounded-xl mb-12">
            <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Comprometimento Total
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(summary.totalDebt)}
          </p>
          {summary.totalLimit > 0 && (
            <div className="absolute top-10 right-10 flex items-center gap-2 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
              <span className="text-[10px] font-black text-rose-500 tracking-tighter">
                {((summary.totalDebt / summary.totalLimit) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#ff632a] p-8 rounded-3xl shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
          <div className="p-3 bg-white/20 border border-white/20 text-white w-fit rounded-xl mb-12">
            <Sparkles size={20} />
          </div>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
            Margem Residual Livre
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(summary.availableLimit)}
          </p>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-1000"></div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
        {loading ? (
          <div className="md:col-span-2 h-64 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff632a]"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Sincronizando Cartões...
            </p>
          </div>
        ) : cards.length === 0 ? (
          <div className="md:col-span-2 bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] p-24 text-center">
            <CardIcon size={64} className="mx-auto text-slate-700 mb-8" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Nenhum cartão identificado.
            </h3>
            <p className="text-slate-500 mb-12 text-sm max-w-sm mx-auto font-medium">
              Centralize a gestÃ£o das suas faturas e limites para ter controle
              total do seu poder de compra.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-12 py-5 border border-[#ff632a] text-[#ff632a] rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff632a] hover:text-white transition-all shadow-xl active:scale-95"
            >
              Adicionar Primeiro Cartão
            </button>
          </div>
        ) : (
          cards.map((card) => (
            <CreditCardCard
              key={card.id}
              card={card}
              onDelete={handleDeleteCard}
              onClick={() => setDetailedCard(card)}
            />
          ))
        )}
      </div>

      {/* Helpful Insight */}
      {!loading && cards.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-3xl flex items-start gap-6 group hover:bg-blue-500/10 transition-colors">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1">
              Dica de Gestão G4
            </h4>
            <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
              Procure manter a utilização de cada cartão abaixo de{" "}
              <span className="text-blue-400 font-bold">30%</span> do limite
              total para preservar seu score de crédito e garantir saúde
              financeira a longo prazo.
            </p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <CreditCardForm
          onCardAdded={fetchData}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {detailedCard && (
        <CreditCardDetailModal
          card={detailedCard}
          onClose={() => setDetailedCard(null)}
        />
      )}
    </div>
  );
}
