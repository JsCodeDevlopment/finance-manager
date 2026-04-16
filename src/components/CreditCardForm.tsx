import {
  Calendar,
  CreditCard as CardIcon,
  Edit2,
  Palette,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { CreditCard } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface CreditCardFormProps {
  onCardAdded: () => void;
  onClose: () => void;
  card?: CreditCard;
}

export function CreditCardForm({
  onCardAdded,
  onClose,
  card,
}: CreditCardFormProps) {
  const [name, setName] = useState(card?.name || "");
  const [limit, setLimit] = useState(card?.limit_amount.toString() || "");
  const [closingDay, setClosingDay] = useState(
    card?.closing_day.toString() || "",
  );
  const [dueDay, setDueDay] = useState(card?.due_day.toString() || "");
  const [color, setColor] = useState(card?.color || "#ff632a");
  const [last4, setLast4] = useState(card?.last_4 || "");
  const [loading, setLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const colors = [
    "#ff632a", // Orange (Default)
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Violet
    "#f43f5e", // Rose
    "#f59e0b", // Amber
    "#000000", // Black
    "#475569", // Slate
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const cardData = {
        user_id: user.id,
        name,
        limit_amount: parseFloat(limit),
        closing_day: parseInt(closingDay),
        due_day: parseInt(dueDay),
        color,
        last_4: last4,
      };

      const { error } = card
        ? await supabase.from("credit_cards").update(cardData).eq("id", card.id)
        : await supabase.from("credit_cards").insert([cardData]);

      if (error) throw error;

      onCardAdded();
      onClose();
    } catch (error: any) {
      setDialogConfig({
        isOpen: true,
        title: "Erro ao Salvar",
        description: "Erro ao salvar cartão: " + error.message,
        variant: "danger",
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
      ></div>
      <div className="relative bg-[#020617] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-[#ff632a]/10 text-[#ff632a] rounded-xl border border-[#ff632a]/20">
                <CardIcon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {card ? "Editar Cartão" : "Novo Cartão"}
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {card
                ? "Atualize as configurações do seu cartão."
                : "Configure os detalhes do seu cartão de crédito."}
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
                Nome do Cartão / Instituição
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Nubank, Inter Black, Visa Infinity..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                  Limite Total
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">
                    R$
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full bg-black/20 p-4 pl-10 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                  Últimos 4 digitos (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="0000"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1 flex items-center gap-2">
                  <Calendar size={12} /> Fechamento (Dia)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 5"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1 flex items-center gap-2">
                  <Calendar size={12} /> Vencimento (Dia)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 12"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full bg-black/20 p-4 rounded-xl border border-white/5 focus:border-[#ff632a] outline-none font-bold text-white placeholder-slate-700 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 ml-1 flex items-center gap-2">
                <Palette size={12} /> Identidade Visual
              </label>
              <div className="flex flex-wrap gap-4">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 active:scale-90 ${color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#ff632a] hover:text-white transition-all active:scale-95 shadow-2xl disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
          >
            {card ? <Edit2 size={18} /> : <Plus size={18} />}
            {loading
              ? "Salvando..."
              : card
                ? "Salvar Alterações"
                : "Confirmar Cartão"}
          </button>
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
