import { Plus, X, Edit2, WalletCards } from "lucide-react";
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface Reservation {
  id: string;
  name: string;
  total_amount: number;
}

interface ReservationFormProps {
  onReservationAdded: () => void;
  onClose: () => void;
  selectedMonth: Date;
  reservation?: Reservation;
}

export function ReservationForm({ 
  onReservationAdded, 
  onClose, 
  selectedMonth,
  reservation 
}: ReservationFormProps) {
  const [name, setName] = useState(reservation?.name || "");
  const [total, setTotal] = useState(reservation?.total_amount.toString() || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (!total || isNaN(parseFloat(total))) {
        throw new Error("Informe um valor total válido.");
      }

      const reservationData = {
        user_id: user.id,
        name,
        total_amount: parseFloat(total),
        month_date: format(selectedMonth, "yyyy-MM-01"),
      };

      const { error } = reservation
        ? await supabase.from("reservations").update({
            name,
            total_amount: parseFloat(total)
          }).eq("id", reservation.id)
        : await supabase.from("reservations").insert([reservationData]);

      if (error) throw error;

      onReservationAdded();
      onClose();
    } catch (error: any) {
      setDialogConfig({
        isOpen: true,
        title: "Erro ao Salvar",
        description: error.message,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />
      <div className="relative bg-[#020617] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-[#ff632a]/10 text-[#ff632a] rounded-xl border border-[#ff632a]/20">
                <WalletCards size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {reservation ? "Editar Reserva" : "Nova Reserva"}
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {reservation ? "Atualize os detalhes do seu pote de reserva." : "Configure um novo pote para seus gastos específicos."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                Identificação da Reserva
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Reserva Emergencial, Reforma, Viagem..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                Aporte Total (R$)
              </label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-5 bg-white/5 border border-white/5 text-slate-400 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-[#ff632a] hover:text-white transition-all active:scale-95 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {reservation ? <Edit2 size={18} /> : <Plus size={18} />}
              {loading ? "Processando..." : reservation ? "Salvar Alterações" : "Consolidar Reserva"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
        title={dialogConfig.title}
        description={dialogConfig.description}
        variant={dialogConfig.variant}
      />
    </div>
  );
}
