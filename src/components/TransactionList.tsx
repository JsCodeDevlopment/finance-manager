import { addMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseSafeDate, formatDisplayDate, addMonthsSafe } from "../helpers/date-utils";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Edit2,
  Filter,
  Hash,
  MoreVertical,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../helpers/currency-formater";
import { supabase } from "../lib/supabase";
import { Transaction } from "../types";

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionUpdated: () => void;
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

export function TransactionList({
  transactions,
  onTransactionUpdated,
  selectedMonth,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    category: "",
    due_date: "",
    reservation_id: "" as string | null,
    credit_card_id: "" as string | null,
    installments: "1",
    startInstallment: "1",
    amountMode: "unit" as "total" | "unit",
    updateAllInstallments: false,
    installment_group_id: "" as string | null,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
  }>({
    isOpen: false,
    transaction: null,
  });

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({ key: "due_date", direction: "descending" });
  const [expandedCardGroups, setExpandedCardGroups] = useState<string[]>([]);

  useEffect(() => {
    fetchReservations();
  }, [selectedMonth]);

  const fetchReservations = async () => {
    const monthStr = format(selectedMonth, "yyyy-MM-01");
    const { data: resData } = await supabase
      .from("reservations")
      .select("id, name")
      .eq("month_date", monthStr);

    if (resData) setReservations(resData);

    const { data: cardsData } = await supabase
      .from("credit_cards")
      .select("id, name");
    if (cardsData) setCreditCards(cardsData);
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.category.toLowerCase().includes(lowerSearch) ||
          t.amount.toString().includes(searchTerm) ||
          t.due_date.includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      const isPaid = statusFilter === "paid";
      result = result.filter((t) => t.is_paid === isPaid);
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Transaction] ?? "";
        const bValue = b[sortConfig.key as keyof Transaction] ?? "";
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [transactions, searchTerm, statusFilter, sortConfig]);

  const groupedTransactions = useMemo(() => {
    // Se estiver pesquisando, nÃ£o agrupa para facilitar encontrar itens especÃ­ficos
    if (searchTerm) {
      return filteredAndSortedTransactions.map(t => ({ type: 'transaction' as const, data: t }));
    }

    const groups: Record<string, { 
      type: 'card-group', 
      cardId: string, 
      cardName: string, 
      total: number, 
      is_paid: boolean, 
      due_date: string, 
      transactions: Transaction[] 
    }> = {};
    const result: ( { type: 'transaction', data: Transaction } | { type: 'card-group', cardId: string, cardName: string, total: number, is_paid: boolean, due_date: string, transactions: Transaction[] } )[] = [];

    filteredAndSortedTransactions.forEach(t => {
      if (t.credit_card_id && t.type === 'expense') {
        const cardId = t.credit_card_id;
        if (!groups[cardId]) {
          const card = creditCards.find(c => c.id === cardId);
          groups[cardId] = {
            type: 'card-group',
            cardId: cardId,
            cardName: card?.name || "Fatura do CartÃ£o",
            total: 0,
            is_paid: true,
            due_date: t.due_date,
            transactions: []
          };
          result.push(groups[cardId]);
        }
        groups[cardId].total += t.amount;
        groups[cardId].transactions.push(t);
        if (!t.is_paid) groups[cardId].is_paid = false;
        // Mantém a data mais tardia como referência da fatura
        if (t.due_date > groups[cardId].due_date) groups[cardId].due_date = t.due_date;
      } else {
        result.push({ type: 'transaction', data: t });
      }
    });

    return result;
  }, [filteredAndSortedTransactions, searchTerm, creditCards]);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const togglePaid = async (id: string, isPaid: boolean) => {
    const { error } = await supabase
      .from("transactions")
      .update({ is_paid: !isPaid })
      .eq("id", id);

    if (!error) {
      onTransactionUpdated();
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      due_date: transaction.due_date,
      reservation_id: transaction.reservation_id || null,
      credit_card_id: transaction.credit_card_id || null,
      installments: transaction.total_installments?.toString() || "1",
      startInstallment: transaction.installment_number?.toString() || "1",
      amountMode: "unit",
      updateAllInstallments: false,
      installment_group_id: transaction.installment_group_id || null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEdit = async (transaction: Transaction) => {
    const totalInstallments = parseInt(editForm.installments) || 1;
    const startInst = parseInt(editForm.startInstallment) || 1;
    const baseAmount = parseFloat(editForm.amount);
    const amountPerInstallment = editForm.amountMode === "total" ? baseAmount / totalInstallments : baseAmount;
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    try {
      // Caso 1: Atualização em Massa de Parcelas Pendentes
      if (editForm.updateAllInstallments && editForm.installment_group_id) {
        const { data: futureTransactions } = await supabase
          .from("transactions")
          .select("id, installment_number")
          .eq("installment_group_id", editForm.installment_group_id)
          .gte("installment_number", transaction.installment_number || 0);

        if (futureTransactions) {
          const updates = futureTransactions.map(t => {
            let baseDescription = editForm.description;
            if (baseDescription.includes(" (")) {
              baseDescription = baseDescription.split(" (")[0];
            }
            const finalDescription = (totalInstallments > 1)
              ? `${baseDescription} (${t.installment_number}/${totalInstallments})`
              : baseDescription;

            return supabase
              .from("transactions")
              .update({
                type: editForm.type,
                amount: amountPerInstallment,
                description: finalDescription,
                category: editForm.category,
                reservation_id: editForm.reservation_id,
                credit_card_id: editForm.credit_card_id,
                total_installments: totalInstallments,
              })
              .eq("id", t.id);
          });
          await Promise.all(updates);
        }
      } 
      // Caso 2: Transformando uma transação simples em parcelada (com offset)
      else if (totalInstallments > 1 && !editForm.installment_group_id) {
        const groupId = crypto.randomUUID();
        
        // Atualiza a primeira (que pode ser a parcela #startInst)
        await supabase
          .from("transactions")
          .update({
            type: editForm.type,
            amount: amountPerInstallment,
            description: `${editForm.description} (${startInst}/${totalInstallments})`,
            category: editForm.category,
            due_date: editForm.due_date,
            reservation_id: editForm.reservation_id,
            credit_card_id: editForm.credit_card_id,
            installment_group_id: groupId,
            installment_number: startInst,
            total_installments: totalInstallments,
          })
          .eq("id", transaction.id);

        // 1. Criar as parcelas ANTERIORES (Passado - jÃ¡ pagas)
        const pastTransactions = [];
        for (let i = 1; i < startInst; i++) {
          const monthsToSubtract = startInst - i;
          const pastDateStr = addMonthsSafe(editForm.due_date, -monthsToSubtract);
          pastTransactions.push({
            type: editForm.type,
            amount: amountPerInstallment,
            description: `${editForm.description} (${i}/${totalInstallments})`,
            category: editForm.category,
            due_date: pastDateStr,
            reservation_id: editForm.reservation_id,
            credit_card_id: editForm.credit_card_id,
            installment_group_id: groupId,
            installment_number: i,
            total_installments: totalInstallments,
            user_id: userId,
            is_paid: true // Retroativas assumidas como pagas
          });
        }

        // 2. Criar as parcelas PRÃ“XIMAS (Futuro - em aberto)
        const nextTransactions = [];
        for (let i = startInst + 1; i <= totalInstallments; i++) {
          const monthsToAdd = i - startInst;
          const nextDateStr = addMonthsSafe(editForm.due_date, monthsToAdd);
          nextTransactions.push({
            type: editForm.type,
            amount: amountPerInstallment,
            description: `${editForm.description} (${i}/${totalInstallments})`,
            category: editForm.category,
            due_date: nextDateStr,
            reservation_id: editForm.reservation_id,
            credit_card_id: editForm.credit_card_id,
            installment_group_id: groupId,
            installment_number: i,
            total_installments: totalInstallments,
            user_id: userId,
            is_paid: false
          });
        }

        const allNew = [...pastTransactions, ...nextTransactions];
        if (allNew.length > 0) {
          const { error: insertError } = await supabase.from("transactions").insert(allNew);
          if (insertError) throw insertError;
        }
      }
      // Caso 3: AtualizaÃ§Ã£o Simples
      else {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            type: editForm.type,
            amount: amountPerInstallment,
            description: editForm.description,
            category: editForm.category,
            due_date: editForm.due_date,
            reservation_id: editForm.reservation_id,
            credit_card_id: editForm.credit_card_id,
            installment_number: startInst,
            total_installments: totalInstallments,
          })
          .eq("id", transaction.id);
        
        if (updateError) throw updateError;
      }

      onTransactionUpdated();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Erro ao processar atualização.");
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (transaction.installment_group_id) {
      setDeleteConfirm({ isOpen: true, transaction });
    } else {
      if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        await executeDelete(transaction.id);
      }
    }
  };

  const executeDelete = async (id: string, groupId?: string) => {
    const { error } = groupId 
      ? await supabase.from("transactions").delete().eq("installment_group_id", groupId)
      : await supabase.from("transactions").delete().eq("id", id);

    if (!error) {
      onTransactionUpdated();
      setDeleteConfirm({ isOpen: false, transaction: null });
    } else {
      alert("Erro ao excluir transação");
    }
  };

  const renderTransactionRow = (transaction: Transaction) => (
    <div
      key={transaction.id}
      className={`group bg-white/5 backdrop-blur-3xl p-6 lg:px-8 rounded-3xl border transition-all duration-500 flex flex-col lg:grid lg:grid-cols-[1fr_120px_160px_220px] gap-6 lg:gap-8 items-center overflow-hidden relative ${editingId === transaction.id ? "border-[#ff632a] bg-white/10" : "border-white/5 hover:border-white/10 hover:bg-white/[0.07]"}`}
    >
      <div
        className={`absolute top-0 left-0 w-1.5 h-full ${transaction.type === "income" ? "bg-emerald-500/30" : "bg-rose-500/30"} transition-all`}
      />

      {editingId === transaction.id ? (
        <div className="lg:col-span-4 w-full flex flex-col gap-8 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Fluxo</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "income" | "expense" })}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
              >
                <option value="income" className="bg-[#020617]">Entrada</option>
                <option value="expense" className="bg-[#020617]">Saída</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Capital</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Identificador</label>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Execução</label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none color-scheme-dark"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Pote Patrimonial</label>
              <select
                value={editForm.reservation_id || ""}
                onChange={(e) => setEditForm({ ...editForm, reservation_id: e.target.value || null })}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
              >
                <option value="" className="bg-[#020617]">Geral</option>
                {reservations.map((res) => (
                  <option key={res.id} value={res.id} className="bg-[#020617]">{res.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">Cartão de Crédito</label>
              <div className="flex gap-4">
                <select
                  value={editForm.credit_card_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, credit_card_id: e.target.value || null })}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
                >
                  <option value="" className="bg-[#020617]">Dinheiro/Pix</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id} className="bg-[#020617]">{card.name}</option>
                  ))}
                </select>

                {editForm.credit_card_id && (
                  <div className="flex flex-col gap-4 animate-in zoom-in-95">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, amountMode: "unit" })}
                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${editForm.amountMode === 'unit' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        Valor p/ Parcela
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, amountMode: "total" })}
                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${editForm.amountMode === 'total' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        Valor Total Compra
                      </button>
                    </div>

                    <div className="flex gap-4">
                      <select
                        value={editForm.installments}
                        onChange={(e) => setEditForm({ ...editForm, installments: e.target.value })}
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                          <option key={n} value={n} className="bg-[#020617]">{n === 1 ? "À Vista" : `${n} Parcelas`}</option>
                        ))}
                      </select>

                      {parseInt(editForm.installments) > 1 && (
                        <input
                          type="number"
                          min="1"
                          max={editForm.installments}
                          value={editForm.startInstallment}
                          onChange={(e) => setEditForm({ ...editForm, startInstallment: e.target.value })}
                          className="w-24 bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-[#ff632a] outline-none"
                          placeholder="#"
                          title="Número da Parcela Atual"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {editForm.installment_group_id && (
            <div className="flex items-center gap-3 px-1 animate-in slide-in-from-top-2">
              <label className="relative flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={editForm.updateAllInstallments}
                  onChange={(e) => setEditForm({ ...editForm, updateAllInstallments: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-white/10 rounded-lg transition-all peer-checked:bg-[#ff632a] peer-checked:border-[#ff632a] group-hover:border-white/20" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                  Aplicar alterações a todas as parcelas futuras desta série
                </span>
              </label>
            </div>
          )}
          <div className="flex items-center gap-4 mt-6 justify-end">
            <button
              onClick={() => handleEdit(transaction)}
              className="bg-white text-black px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#ff632a] hover:text-white transition-all shadow-xl active:scale-95"
            >
              Salvar
            </button>
            <button
              onClick={cancelEdit}
              className="bg-white/5 border border-white/5 text-slate-500 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5 w-full relative z-10 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-all duration-500 group-hover:scale-105 ${transaction.type === "income" ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"}`}>
              {transaction.type === "income" ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white tracking-tight leading-none mb-2.5 truncate group-hover:text-[#ff632a] transition-colors uppercase">
                {transaction.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-0.5 px-2 bg-white/5 text-[8px] text-slate-500 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 border border-white/5">
                  <Tag size={10} /> {transaction.category}
                </span>
                {transaction.reservation_id && (
                  <span className="p-0.5 px-2 bg-[#ff632a]/10 text-[8px] text-[#ff632a] rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 border border-[#ff632a]/20">
                    <ShoppingBag size={10} /> {reservations.find((r) => r.id === transaction.reservation_id)?.name || "Reserva"}
                  </span>
                )}
                {transaction.credit_card_id && (
                  <span className="p-0.5 px-2 bg-blue-500/10 text-[8px] text-blue-400 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 border border-blue-500/20">
                    <CreditCard size={10} /> {creditCards.find((c) => c.id === transaction.credit_card_id)?.name || "Cartão"}
                    {transaction.total_installments && transaction.total_installments > 1 && (
                      <span className="ml-1 text-white/50">({transaction.installment_number}/{transaction.total_installments})</span>
                    )}
                  </span>
                )}
                <span className="p-0.5 px-2 bg-white/5 text-[8px] text-slate-600 rounded-lg font-bold tracking-widest flex items-center gap-1.5 lg:hidden">
                  <Calendar size={10} /> {format(new Date(transaction.due_date), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-start gap-1 relative z-10 px-4 border-l border-white/5">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">Execução</p>
            <p className="text-xs font-bold text-slate-400">{formatDisplayDate(transaction.due_date, "dd MMM yyyy")}</p>
          </div>

          <div className="flex items-center justify-center lg:justify-start relative z-10 w-full lg:w-auto">
            <button
              onClick={() => togglePaid(transaction.id, transaction.is_paid)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 lg:px-5 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 border ${transaction.is_paid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500 hover:text-white" : "bg-[#ff632a]/10 text-[#ff632a] border-[#ff632a]/10 hover:bg-[#ff632a] hover:text-white"}`}
            >
              {transaction.is_paid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              <span>{transaction.is_paid ? "Liquidado" : "Aberto"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto relative z-10">
            <div className="text-left lg:text-right">
              <p className={`text-base lg:text-lg font-bold tracking-tight ${transaction.type === "income" ? "text-emerald-400 lg:text-xl font-black" : "text-white"}`}>
                {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
              <button onClick={() => startEdit(transaction)} className="p-2.5 bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5" title="Editar"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(transaction)} className="p-2.5 bg-rose-500/5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5" title="Excluir"><Trash2 size={14} /></button>
            </div>

            <div className="block lg:hidden group-hover:hidden transition-all opacity-20">
              <MoreVertical size={18} className="text-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search and Filters Bar - Redesigned with Glassmorphism */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ff632a] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Pesquisar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:border-[#ff632a]/50 focus:bg-black/30 transition-all outline-none placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-black/20 px-5 py-3 rounded-xl border border-white/5 transition-all hover:border-white/10">
            <Filter size={16} className="text-[#ff632a]" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "paid" | "unpaid")
              }
              className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#020617]">
                Modo: Todos
              </option>
              <option value="paid" className="bg-[#020617]">
                Modo: Pagos
              </option>
              <option value="unpaid" className="bg-[#020617]">
                Modo: Pendentes
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => requestSort("due_date")}
              className={`p-3.5 rounded-xl border transition-all active:scale-95 ${sortConfig.key === "due_date" ? "bg-[#ff632a] border-[#ff632a] text-white shadow-lg shadow-orange-500/20" : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20"}`}
              title="Ordenar por Data"
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => requestSort("amount")}
              className={`p-3.5 rounded-xl border transition-all active:scale-95 ${sortConfig.key === "amount" ? "bg-[#ff632a] border-[#ff632a] text-white shadow-lg shadow-orange-500/20" : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20"}`}
              title="Ordenar por Valor"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container - List of cards */}
      <div className="space-y-4">
        {groupedTransactions.length === 0 ? (
          <div className="bg-white/5 rounded-3xl p-32 text-center border border-white/5 border-dashed">
            <div className="flex flex-col items-center gap-6 text-slate-600">
              <div className="p-8 bg-white/5 rounded-full border border-white/5">
                <Hash size={48} strokeWidth={1.5} />
              </div>
              <h4 className="font-bold text-xl text-white tracking-tight">
                Vazio Operacional
              </h4>
              <p className="text-slate-500 font-medium max-w-xs mx-auto text-sm">
                Não identificamos registros com os parâmetros aplicados.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="text-[#ff632a] text-[10px] font-bold hover:underline uppercase tracking-[0.2em]"
              >
                Resetar Audiência
              </button>
            </div>
          </div>
        ) : (
          groupedTransactions.map((item) => {
            if (item.type === 'card-group') {
              const isExpanded = expandedCardGroups.includes(item.cardId);
              return (
                <div key={item.cardId} className="space-y-4">
                  {/* Card Invoice Summary Row */}
                  <div
                    onClick={() => {
                      setExpandedCardGroups(prev => 
                        isExpanded ? prev.filter(id => id !== item.cardId) : [...prev, item.cardId]
                      );
                    }}
                    className={`group cursor-pointer bg-white/5 backdrop-blur-3xl p-6 lg:px-8 rounded-3xl border transition-all duration-500 flex flex-col lg:grid lg:grid-cols-[1fr_120px_160px_220px] gap-6 lg:gap-8 items-center overflow-hidden relative border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/[0.03] shadow-lg`}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/30" />
                    
                    <div className="flex items-center gap-5 w-full relative z-10 min-w-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/10 bg-blue-500/10 text-blue-400 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white tracking-tight leading-none mb-2.5 truncate group-hover:text-blue-400 transition-colors uppercase">
                          {item.cardName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="p-0.5 px-2 bg-blue-500/10 text-[8px] text-blue-300 rounded-lg font-bold uppercase tracking-widest border border-blue-500/10">
                            Fatura Consolidada
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Hash size={12} /> {item.transactions.length} lançamentos
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:flex flex-col items-start gap-1 relative z-10 px-4 border-l border-white/5">
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">Referência</p>
                      <p className="text-xs font-bold text-slate-400">
                        {formatDisplayDate(item.due_date, "MMM yyyy")}
                      </p>
                    </div>

                    <div className="flex items-center justify-center lg:justify-start relative z-10 w-full lg:w-auto">
                      <div className={`px-5 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border ${item.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-amber-500/10 text-amber-500 border-amber-500/10'}`}>
                        {item.is_paid ? 'Fatura Liquidada' : 'Fatura em Aberto'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto relative z-10">
                      <div className="text-left lg:text-right">
                         <p className="text-[8px] font-bold uppercase text-slate-600 tracking-widest mb-1">Total da Fatura</p>
                         <p className="text-base lg:text-lg font-bold tracking-tight text-white">- {formatCurrency(item.total)}</p>
                      </div>
                      <div className="p-2.5 bg-white/5 text-slate-500 rounded-xl transition-all border border-white/5 group-hover:text-white group-hover:bg-white/10">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Transactions List */}
                  {isExpanded && (
                    <div className="ml-8 lg:ml-12 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 relative">
                       <div className="absolute left-[-20px] top-0 bottom-4 w-px bg-white/5 border-l border-dashed border-white/10" />
                       {item.transactions.map((transaction) => renderTransactionRow(transaction))}
                    </div>
                  )}
                </div>
              );
            }

            return renderTransactionRow(item.data);
          })
        )}
      </div>

      {/* Modal de Confirmação de Exclusão Inteligente */}
      {deleteConfirm.isOpen && deleteConfirm.transaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ isOpen: false, transaction: null })} />
          
          <div className="relative w-full max-w-md bg-[#020617] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                <Trash2 size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Como deseja excluir?
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Esta transação faz parte de um grupo parcelado. <br />
                  Você pode excluir apenas esta parcela ou todo o grupo.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 pt-4">
                <button
                  onClick={() => executeDelete(deleteConfirm.transaction!.id)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                >
                  Excluir apenas esta parcela
                </button>
                <button
                  onClick={() => executeDelete(deleteConfirm.transaction!.id, deleteConfirm.transaction!.installment_group_id)}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98]"
                >
                  Excluir grupo completo
                </button>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, transaction: null })}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-all"
                >
                  Desistir e manter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
