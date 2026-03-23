import { useEffect, useState, useCallback } from "react";
import { WalletCards, Plus, Minus, Info, Trash2, PieChart, TrendingDown, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../helpers/currency-formater";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reservation {
  id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  created_at: string;
}

export function MoneyUsagePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTotal, setNewTotal] = useState("");

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    
    // Get all reservations
    const { data: resData, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (resError) {
      console.error(resError);
      setLoading(false);
      return;
    }

    // Get all transactions linked to reservations to calculate spent amount
    const { data: transData } = await supabase
      .from("transactions")
      .select("amount, reservation_id")
      .not("reservation_id", "is", null);

    const reservationsWithStats = resData?.map((res: Reservation) => {
      const spent = transData?.filter((t: { amount: number, reservation_id: string }) => t.reservation_id === res.id)
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0;
      
      return {
        ...res,
        spent_amount: spent,
        remaining_amount: res.total_amount - spent
      };
    }) || [];

    setReservations(reservationsWithStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase.from("reservations").insert([{
      user_id: user.id,
      name: newName,
      total_amount: parseFloat(newTotal)
    }]);

    if (!error) {
      setNewName("");
      setNewTotal("");
      setShowAddForm(false);
      fetchReservations();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Isso removerá a reserva, mas as transações vinculadas permanecerão. Continuar?")) return;
    
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (!error) fetchReservations();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Uso do Dinheiro</h1>
          <p className="text-slate-400 font-bold flex items-center gap-2 text-sm tracking-tight">
            <Info size={16} className="text-[#ff632a]" />
            Módulos de reserva patrimonial para consumo específico.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl uppercase text-[10px] tracking-widest border border-white/5 active:scale-95 ${
            showAddForm ? 'bg-white/5 text-slate-500' : 'bg-[#ff632a] text-white shadow-orange-500/20'
          }`}
        >
          {showAddForm ? <Minus size={18} /> : <Plus size={18} />}
          <span>{showAddForm ? 'Cancelar' : 'Nova Reserva'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-3xl border border-white/10 shadow-2xl slide-in-up transition-all">
           <form onSubmit={handleAddReservation} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-3 ml-2">Identificação</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Reserva Emergencial, Reforma..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-3 ml-2">Aporte Total</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  placeholder="R$ 0,00" 
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                  className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full h-[58px] bg-white text-black rounded-xl font-bold hover:bg-[#ff632a] hover:text-white transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-xl"
              >
                <Plus size={18} /> Consolidar Reserva
              </button>
           </form>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="p-3 bg-white/5 border border-white/10 text-[#ff632a] w-fit rounded-xl mb-12"><PieChart size={20}/></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Alocado</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(reservations.reduce((s, r) => s + r.total_amount, 0))}</p>
         </div>
         <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit rounded-xl mb-12"><TrendingDown size={20}/></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Fluxo de Saída</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(reservations.reduce((s, r) => s + r.spent_amount, 0))}</p>
         </div>
         <div className="bg-[#ff632a] p-8 rounded-3xl shadow-2xl shadow-orange-500/10">
            <div className="p-3 bg-black/10 border border-black/10 text-white w-fit rounded-xl mb-12"><Clock size={20}/></div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Disponível em Potes</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(reservations.reduce((s, r) => s + r.remaining_amount, 0))}</p>
         </div>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="md:col-span-2 h-64 flex flex-col items-center justify-center space-y-4">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff632a]"></div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Reservas</p>
          </div>
        ) : (
          reservations.length === 0 ? (
            <div className="md:col-span-2 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-20 text-center">
               <WalletCards size={48} className="mx-auto text-slate-700 mb-6" />
               <h3 className="text-xl font-bold text-slate-500 mb-2">Nenhum aporte identificado.</h3>
               <p className="text-slate-600 mb-10 text-sm max-w-xs mx-auto">Segregue seu capital para monitorar metas e consumos específicos.</p>
               <button onClick={() => setShowAddForm(true)} className="px-10 py-4 border border-[#ff632a] text-[#ff632a] rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff632a] hover:text-white transition-all">Consolidar Primeiro Pote</button>
            </div>
          ) : (
            reservations.map((res) => (
              <div key={res.id} className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl hover:border-white/20 transition-all group overflow-hidden relative">
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 text-[#ff632a] flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <WalletCards size={28} />
                     </div>
                     <div>
                       <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">{res.name}</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Referência: {format(new Date(res.created_at), 'MMM yyyy', { locale: ptBR })}</p>
                     </div>
                  </div>
                  <button onClick={() => handleDelete(res.id)} className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-2 relative z-10">
                   <div className="flex justify-between items-end mb-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Absorção de Capital</p>
                      <p className="text-sm font-bold text-white tracking-tight">
                        {((res.spent_amount / res.total_amount) * 100).toFixed(1)}%
                      </p>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${res.remaining_amount <= 0 ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : 'bg-[#ff632a] shadow-lg shadow-orange-500/30'}`}
                        style={{ width: `${Math.min((res.spent_amount / res.total_amount) * 100, 100)}%` }}
                      ></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mb-2">Total Consolidado</p>
                        <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(res.spent_amount)}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mb-2">Disponibilidade</p>
                        <p className="text-lg font-bold text-[#ff632a] tracking-tight">{formatCurrency(res.remaining_amount)}</p>
                      </div>
                   </div>
                </div>

                {/* Info Text */}
                <p className="mt-8 text-[10px] text-slate-600 font-bold border-t border-white/5 pt-6 text-center tracking-normal">
                  Vincule transações de saída a este pote para atualizar o saldo operacional.
                </p>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff632a]/5 rounded-full blur-[60px] group-hover:bg-[#ff632a]/10 transition-all duration-1000 -z-10"></div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
