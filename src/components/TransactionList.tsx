import { useState, useMemo, useEffect } from "react";
import { 
  Edit2, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Calendar, 
  Hash, 
  Tag, 
  MoreVertical, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShoppingBag,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../helpers/currency-formater";
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
  });

  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({ key: "due_date", direction: "descending" });

  useEffect(() => {
    fetchReservations();
  }, [selectedMonth]);

  const fetchReservations = async () => {
    const monthStr = format(selectedMonth, 'yyyy-MM-01');
    const { data } = await supabase
      .from("reservations")
      .select("id, name")
      .eq("month_date", monthStr);
    
    if (data) setReservations(data);
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lowerSearch) ||
        t.category.toLowerCase().includes(lowerSearch) ||
        t.amount.toString().includes(searchTerm) ||
        t.due_date.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      const isPaid = statusFilter === "paid";
      result = result.filter(t => t.is_paid === isPaid);
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
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEdit = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .update({
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        category: editForm.category,
        due_date: editForm.due_date,
        reservation_id: editForm.reservation_id || null,
      })
      .eq("id", id);

    if (!error) {
      onTransactionUpdated();
      cancelEdit();
    } else {
      alert("Erro ao atualizar transação");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (!error) {
        onTransactionUpdated();
      } else {
        alert("Erro ao excluir transação");
      }
    }
  };

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
                onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "unpaid")}
                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#020617]">Modo: Todos</option>
                <option value="paid" className="bg-[#020617]">Modo: Pagos</option>
                <option value="unpaid" className="bg-[#020617]">Modo: Pendentes</option>
              </select>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => requestSort('due_date')}
                className={`p-3.5 rounded-xl border transition-all active:scale-95 ${sortConfig.key === 'due_date' ? 'bg-[#ff632a] border-[#ff632a] text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}
                title="Ordenar por Data"
              >
                <Calendar size={18} />
              </button>
              <button 
                onClick={() => requestSort('amount')}
                className={`p-3.5 rounded-xl border transition-all active:scale-95 ${sortConfig.key === 'amount' ? 'bg-[#ff632a] border-[#ff632a] text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}
                title="Ordenar por Valor"
              >
                <ArrowUpDown size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* Table Container - List of cards */}
      <div className="space-y-4">
        {filteredAndSortedTransactions.length === 0 ? (
           <div className="bg-white/5 rounded-3xl p-32 text-center border border-white/5 border-dashed">
              <div className="flex flex-col items-center gap-6 text-slate-600">
                 <div className="p-8 bg-white/5 rounded-full border border-white/5">
                    <Hash size={48} strokeWidth={1.5} />
                 </div>
                 <h4 className="font-bold text-xl text-white tracking-tight">Vazio Operacional</h4>
                 <p className="text-slate-500 font-medium max-w-xs mx-auto text-sm">Não identificamos registros com os parâmetros aplicados.</p>
                 <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} className="text-[#ff632a] text-[10px] font-bold hover:underline uppercase tracking-[0.2em]">Resetar Audiência</button>
              </div>
           </div>
        ) : (
          filteredAndSortedTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className={`group bg-white/5 backdrop-blur-3xl p-6 lg:px-8 rounded-3xl border transition-all duration-500 flex flex-col lg:grid lg:grid-cols-[1fr_120px_160px_220px] gap-6 lg:gap-8 items-center overflow-hidden relative ${editingId === transaction.id ? 'border-[#ff632a] bg-white/10' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.07]'}`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${transaction.type === 'income' ? 'bg-emerald-500/30' : 'bg-rose-500/30'} transition-all`} />

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
                            {reservations.map(res => (
                              <option key={res.id} value={res.id} className="bg-[#020617]">{res.name}</option>
                            ))}
                          </select>
                      </div>
                      <div className="flex items-center gap-4 self-end">
                        <button onClick={() => handleEdit(transaction.id)} className="bg-white text-black px-8 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#ff632a] hover:text-white transition-all shadow-xl active:scale-95">Salvar</button>
                        <button onClick={cancelEdit} className="bg-white/5 border border-white/5 text-slate-500 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95">Descartar</button>
                      </div>
                   </div>
                </div>
              ) : (
                <>
                  {/* Basic Info: Icon + Description + Metadata */}
                  <div className="flex items-center gap-5 w-full relative z-10 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-all duration-500 group-hover:scale-105 ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'}`}>
                        {transaction.type === 'income' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white tracking-tight leading-none mb-2.5 truncate group-hover:text-[#ff632a] transition-colors uppercase">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="p-0.5 px-2 bg-white/5 text-[8px] text-slate-500 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 border border-white/5">
                            <Tag size={10} /> {transaction.category}
                         </span>
                         {transaction.reservation_id && (
                           <span className="p-0.5 px-2 bg-[#ff632a]/10 text-[8px] text-[#ff632a] rounded-lg font-bold uppercase tracking-widest flex items-center gap-1.5 border border-[#ff632a]/20">
                              <ShoppingBag size={10} /> {reservations.find(r => r.id === transaction.reservation_id)?.name || "Reserva"}
                           </span>
                         )}
                         <span className="p-0.5 px-2 bg-white/5 text-[8px] text-slate-600 rounded-lg font-bold tracking-widest flex items-center gap-1.5 lg:hidden">
                            <Calendar size={10} /> 
                            {format(new Date(transaction.due_date), "dd/MM", { locale: ptBR })}
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Date - Desktop Column */}
                  <div className="hidden lg:flex flex-col items-start gap-1 relative z-10 px-4 border-l border-white/5">
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">Execução</p>
                      <p className="text-xs font-bold text-slate-400">
                        {format(new Date(transaction.due_date), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                  </div>

                  {/* Status Interaction - Desktop Column */}
                  <div className="flex items-center justify-center lg:justify-start relative z-10 w-full lg:w-auto">
                    <button
                      onClick={() => togglePaid(transaction.id, transaction.is_paid)}
                      className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 lg:px-5 py-3 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 border ${
                        transaction.is_paid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500 hover:text-white"
                          : "bg-[#ff632a]/10 text-[#ff632a] border-[#ff632a]/10 hover:bg-[#ff632a] hover:text-white"
                      }`}
                    >
                      {transaction.is_paid ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      <span>{transaction.is_paid ? 'Liquidado' : 'Aberto'}</span>
                    </button>
                  </div>

                  {/* Amount and Actions - Desktop Column */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto relative z-10">
                    <div className="text-left lg:text-right">
                      <p className={`text-base lg:text-lg font-bold tracking-tight ${transaction.type === 'income' ? 'text-emerald-400 lg:text-xl font-black' : 'text-white'}`}>
                         {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => startEdit(transaction)}
                        className="p-2.5 bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2.5 bg-rose-500/5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="block lg:hidden group-hover:hidden transition-all opacity-20">
                       <MoreVertical size={18} className="text-white" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
