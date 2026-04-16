import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  FileText,
  PlusCircle,
  ShoppingBag,
  Tag,
  Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { addMonthsSafe } from "../helpers/date-utils";
import { supabase } from "../lib/supabase";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface TransactionFormProps {
  onTransactionAdded: () => void;
  selectedMonth: Date;
}

interface Reservation {
  id: string;
  name: string;
}

interface CreditCard {
  id: string;
  name: string;
}

export function TransactionForm({
  onTransactionAdded,
  selectedMonth,
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState(format(selectedMonth, "yyyy-MM-dd"));
  const [reservationId, setReservationId] = useState<string>("");
  const [creditCardId, setCreditCardId] = useState<string>("");
  const [installments, setInstallments] = useState("1");
  const [startInstallment, setStartInstallment] = useState("1");
  const [amountMode, setAmountMode] = useState<"total" | "unit">("unit");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isSubscription, setIsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchReservations();
    fetchCreditCards();
  }, [selectedMonth]);

  const fetchCreditCards = async () => {
    const { data } = await supabase
      .from("credit_cards")
      .select("id, name")
      .order("name");

    if (data) {
      setCreditCards(data);
    }
  };

  const fetchReservations = async () => {
    const monthStr = format(selectedMonth, "yyyy-MM-01");
    const { data } = await supabase
      .from("reservations")
      .select("id, name")
      .eq("month_date", monthStr)
      .order("name");

    if (data) {
      setReservations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuário não autenticado");

      const numInstallments = parseInt(installments) || 1;
      const startInst = parseInt(startInstallment) || 1;
      const baseAmount = parseFloat(amount);
      const amountPerInstallment =
        amountMode === "total" ? baseAmount / numInstallments : baseAmount;
      const installmentGroupId =
        numInstallments > 1 ? crypto.randomUUID() : null;

      const transactionsToInsert = [];

      // Criar parcelas do passado (jÃ¡ pagas)
      for (let i = 1; i < startInst; i++) {
        const monthsToSubtract = startInst - i;
        const pastDateStr = addMonthsSafe(dueDate, -monthsToSubtract);
        transactionsToInsert.push({
          type,
          amount: amountPerInstallment,
          description: `${description} (${i}/${numInstallments})`,
          category,
          due_date: pastDateStr,
          reservation_id: reservationId || null,
          credit_card_id: creditCardId || null,
          installment_number: i,
          total_installments: numInstallments,
          installment_group_id: installmentGroupId,
          user_id: user.id,
          is_paid: true, // JÃ¡ passou, assume-se paga
        });
      }

      // Criar parcela atual e futuras (em aberto)
      for (let i = startInst; i <= numInstallments; i++) {
        const monthsToAdd = i - startInst;
        const nextDateStr = addMonthsSafe(dueDate, monthsToAdd);
        transactionsToInsert.push({
          type,
          amount: amountPerInstallment,
          description:
            numInstallments > 1
              ? `${description} (${i}/${numInstallments})`
              : description,
          category,
          due_date: nextDateStr,
          reservation_id: reservationId || null,
          credit_card_id: creditCardId || null,
          installment_number: i,
          total_installments: numInstallments,
          installment_group_id: installmentGroupId,
          is_subscription: numInstallments === 1 ? isSubscription : false,
          user_id: user.id,
          is_paid: type === "income" ? true : false,
        });
      }

      const { error } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);

      if (error) throw error;

      if (!error) {
        setAmount("");
        setDescription("");
        setCategory("");
        setDueDate(format(selectedMonth, "yyyy-MM-dd"));
        setReservationId("");
        setCreditCardId("");
        setInstallments("1");
        setStartInstallment("1");
        setIsSubscription(false);
        setAmountMode("unit");
        onTransactionAdded();
      } else {
        throw error;
      }
    } catch (error: unknown) {
      const err = error as Error;
      setDialogConfig({
        isOpen: true,
        title: "Erro ao Salvar",
        description: "Não foi possível registrar a transação: " + err.message,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all border-2 text-xs uppercase tracking-widest ${
            type === "income"
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-2xl shadow-emerald-500/10"
              : "bg-black/20 border-white/5 text-slate-600 hover:border-white/10 hover:text-slate-400"
          }`}
        >
          <ArrowUpCircle size={18} />
          Aporte
        </button>
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all border-2 text-xs uppercase tracking-widest ${
            type === "expense"
              ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-2xl shadow-rose-500/10"
              : "bg-black/20 border-white/5 text-slate-600 hover:border-white/10 hover:text-slate-400"
          }`}
        >
          <ArrowDownCircle size={18} />
          Saída
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
            <Wallet size={18} />
          </div>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none"
          />
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
            <FileText size={18} />
          </div>
          <input
            type="text"
            required
            placeholder="Identificador da Transação"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
              <Tag size={18} />
            </div>
            <input
              type="text"
              required
              placeholder="Setor/Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none"
            />
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
              <Calendar size={18} />
            </div>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none color-scheme-dark"
            />
          </div>
        </div>

        {type === "expense" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
                <CreditCard size={18} />
              </div>
              <select
                value={creditCardId}
                onChange={(e) => setCreditCardId(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none appearance-none"
              >
                <option value="" className="bg-[#020617]">
                  Método: Dinheiro/Pix
                </option>
                {creditCards.map((card) => (
                  <option
                    key={card.id}
                    value={card.id}
                    className="bg-[#020617]"
                  >
                    {card.name}
                  </option>
                ))}
              </select>
            </div>

            {creditCardId && (
              <div className="space-y-4 animate-in zoom-in-95 duration-500">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAmountMode("unit")}
                    className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${amountMode === "unit" ? "bg-white/10 text-white border border-white/10 shadow-lg" : "text-slate-600 hover:text-slate-400"}`}
                  >
                    Valor p/ Parcela
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountMode("total")}
                    className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${amountMode === "total" ? "bg-white/10 text-white border border-white/10 shadow-lg" : "text-slate-600 hover:text-slate-400"}`}
                  >
                    Valor Total Compra
                  </button>
                </div>

                {installments === "1" && (
                  <button
                    type="button"
                    onClick={() => setIsSubscription(!isSubscription)}
                    className={`w-full py-4 rounded-xl font-bold transition-all border-2 text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 ${
                      isSubscription
                        ? "bg-[#ff632a]/10 border-[#ff632a]/50 text-[#ff632a] shadow-lg"
                        : "bg-black/20 border-white/5 text-slate-600 hover:border-white/10"
                    }`}
                  >
                    <PlusCircle size={14} className={isSubscription ? "rotate-45 transition-transform" : "transition-transform"} />
                    {isSubscription ? "Assinatura Ativa" : "Marcar como Assinatura"}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
                      <span className="text-[10px] font-black italic">X</span>
                    </div>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(
                        (n) => (
                          <option key={n} value={n} className="bg-[#020617]">
                            {n === 1 ? "À Vista" : `${n} Parcelas`}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {parseInt(installments) > 1 && (
                    <div className="relative group animate-in slide-in-from-right-4">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
                        <span className="text-[10px] font-black italic">#</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={installments}
                        value={startInstallment}
                        onChange={(e) => setStartInstallment(e.target.value)}
                        placeholder="Início"
                        className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none"
                        title="Parcela Inicial"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {type === "expense" && (
          <div className="relative group animate-in slide-in-from-top-2 duration-300">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
              <ShoppingBag size={18} />
            </div>
            <select
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none appearance-none"
            >
              <option value="" className="bg-[#020617]">
                Pote Patrimonial: Geral
              </option>
              {reservations.map((res) => (
                <option key={res.id} value={res.id} className="bg-[#020617]">
                  {res.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-16 flex items-center justify-center gap-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#ff632a] hover:text-white transition-all transform active:scale-95 shadow-2xl disabled:opacity-50 mt-4"
      >
        <PlusCircle size={20} />
        {loading ? "Processando..." : "Confirmar Lançamento"}
      </button>

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
        title={dialogConfig.title}
        description={dialogConfig.description}
        variant={dialogConfig.variant}
      />
    </form>
  );
}
