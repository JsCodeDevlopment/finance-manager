import { format } from "date-fns";
import { PlusCircle, Wallet, FileText, Tag, Calendar, ArrowUpCircle, ArrowDownCircle, ShoppingBag } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface TransactionFormProps {
  onTransactionAdded: () => void;
  selectedMonth: Date;
}

interface Reservation {
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
  const [dueDate, setDueDate] = useState(format(selectedMonth, 'yyyy-MM-dd'));
  const [reservationId, setReservationId] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("id, name")
      .order("name");
    
    if (data) {
      setReservations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("transactions").insert([
        {
          type,
          amount: parseFloat(amount),
          description,
          category,
          due_date: dueDate,
          reservation_id: reservationId || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (!error) {
        setAmount("");
        setDescription("");
        setCategory("");
        setDueDate(format(selectedMonth, 'yyyy-MM-dd'));
        setReservationId("");
        onTransactionAdded();
      } else {
        throw error;
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert("Erro ao adicionar transação: " + err.message);
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

        {type === 'expense' && (
          <div className="relative group animate-in slide-in-from-top-2 duration-300">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ff632a] transition-colors">
                <ShoppingBag size={18} />
            </div>
            <select
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#ff632a]/50 focus:bg-black/30 transition-all text-sm outline-none appearance-none"
            >
              <option value="" className="bg-[#020617]">Pote Patrimonial: Geral</option>
              {reservations.map(res => (
                <option key={res.id} value={res.id} className="bg-[#020617]">{res.name}</option>
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
    </form>
  );
}
