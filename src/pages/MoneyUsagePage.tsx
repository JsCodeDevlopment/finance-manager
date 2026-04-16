import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  History,
  Info,
  PieChart,
  Plus,
  PlusCircle,
  Trash2,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { MonthSelector } from "../components/MonthSelector";
import { ReservationForm } from "../components/ReservationForm";
import { formatCurrency } from "../helpers/currency-formater";
import { supabase } from "../lib/supabase";
import { Transaction } from "../types";

interface Reservation {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  transactions?: Transaction[];
}

export function MoneyUsagePage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseFormReservationId, setExpenseFormReservationId] = useState<
    string | null
  >(null);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [isImporting, setIsImporting] = useState(false);
  const [pastReservations, setPastReservations] = useState<Reservation[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<
    Record<string, boolean>
  >({});

  // Reservation form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);

  // Quick Expense form state
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Edit Transaction state
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
  });

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm?: () => void;
    variant?: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const fetchReservations = useCallback(async () => {
    // Get reservations for the selected month
    const monthStr = format(selectedMonth, "yyyy-MM-01");

    const { data: resData, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .eq("month_date", monthStr)
      .order("created_at", { ascending: false });

    if (resError) {
      console.error(resError);
      setLoading(false);
      return;
    }

    // Get all transactions linked to reservations to calculate spent amount
    const { data: transData } = await supabase
      .from("transactions")
      .select("*")
      .not("reservation_id", "is", null)
      .order("due_date", { ascending: false });

    const reservationsWithStats =
      resData?.map((res: Reservation) => {
        const relatedTransactions =
          transData?.filter((t: Transaction) => t.reservation_id === res.id) ||
          [];
        const spent =
          relatedTransactions.reduce(
            (sum: number, t: Transaction) => sum + t.amount,
            0,
          ) || 0;

        return {
          ...res,
          spent_amount: spent,
          remaining_amount: res.total_amount - spent,
          transactions: relatedTransactions,
        };
      }) || [];

    setReservations(reservationsWithStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations, selectedMonth]);

  const handleDelete = async (id: string) => {
    setDialogConfig({
      isOpen: true,
      title: "Confirmar Exclusão",
      description:
        "Isso removerá a reserva, mas as transações vinculadas permanecerão. Continuar?",
      variant: "danger",
      onConfirm: async () => {
        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("id", id);
        if (!error) fetchReservations();
      },
    });
  };

  const startEditReservation = (res: Reservation) => {
    setEditingReservation(res);
    setIsFormOpen(true);
  };

  const handleQuickExpense = async (res: Reservation) => {
    if (!expenseAmount || !expenseDescription) {
      alert("Informe a descrição e o valor do gasto.");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: "expense",
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
          category: res.name,
          reservation_id: res.id,
          due_date: format(new Date(), "yyyy-MM-dd"),
          is_paid: true,
        },
      ]);

      if (error) {
        setDialogConfig({
          isOpen: true,
          title: "Erro",
          description: "Erro ao registrar gasto: " + error.message,
          variant: "danger",
        });
      } else {
        setExpenseAmount("");
        setExpenseDescription("");
        setExpenseFormReservationId(null);
        await fetchReservations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const startEditTransaction = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setEditForm({
      description: t.description,
      amount: t.amount.toString(),
    });
  };

  const handleUpdateTransaction = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .update({
        description: editForm.description,
        amount: parseFloat(editForm.amount),
      })
      .eq("id", id);

    if (!error) {
      setEditingTransactionId(null);
      await fetchReservations();
    } else {
      setDialogConfig({
        isOpen: true,
        title: "Erro",
        description: "Erro ao atualizar: " + error.message,
        variant: "danger",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setDialogConfig({
      isOpen: true,
      title: "Excluir Gasto",
      description: "Tem certeza que deseja excluir este gasto?",
      variant: "danger",
      onConfirm: async () => {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (!error) {
          await fetchReservations();
        } else {
          setDialogConfig({
            isOpen: true,
            title: "Erro",
            description: "Erro ao excluir: " + error.message,
            variant: "danger",
          });
        }
      },
    });
  };

  const openImportModal = async () => {
    setLoading(true);
    const prevMonth = subMonths(selectedMonth, 1);
    const prevMonthStr = format(prevMonth, "yyyy-MM-01");

    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("month_date", prevMonthStr);

    if (data) {
      // Filter out reservations that already exist in current month by name
      const currentNames = reservations.map((r) => r.name);
      const availableToImport = data.filter(
        (r) => !currentNames.includes(r.name),
      );
      setPastReservations(availableToImport);
      setIsImporting(true);
    }
    setLoading(false);
  };

  const handleImportReservations = async (toImport: Reservation[]) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newEntries = toImport.map((r) => ({
      user_id: user.id,
      name: r.name,
      total_amount: r.total_amount,
      month_date: format(selectedMonth, "yyyy-MM-01"),
    }));

    const { error } = await supabase.from("reservations").insert(newEntries);

    if (!error) {
      setIsImporting(false);
      await fetchReservations();
    } else {
      setDialogConfig({
        isOpen: true,
        title: "Erro",
        description: "Erro ao importar: " + error.message,
        variant: "danger",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            Uso do Dinheiro
          </h1>
          <p className="text-slate-400 font-bold flex items-center gap-2 text-sm tracking-tight">
            <Info size={16} className="text-[#ff632a]" />
            Módulos de reserva patrimonial para consumo específico.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 shadow-2xl">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>

          <button
            onClick={() => {
              setEditingReservation(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl uppercase text-[10px] tracking-widest border border-white/5 bg-[#ff632a] text-white shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95"
          >
            <Plus size={18} />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="p-3 bg-white/5 border border-white/10 text-[#ff632a] w-fit rounded-xl mb-12">
            <PieChart size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Total Alocado
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(
              reservations.reduce((s, r) => s + r.total_amount, 0),
            )}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit rounded-xl mb-12">
            <TrendingDown size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Fluxo de Saída
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(
              reservations.reduce((s, r) => s + r.spent_amount, 0),
            )}
          </p>
        </div>
        <div className="bg-[#ff632a] p-8 rounded-3xl shadow-2xl shadow-orange-500/10">
          <div className="p-3 bg-black/10 border border-black/10 text-white w-fit rounded-xl mb-12">
            <Clock size={20} />
          </div>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
            Disponível em Potes
          </p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(
              reservations.reduce((s, r) => s + r.remaining_amount, 0),
            )}
          </p>
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="md:col-span-2 h-64 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff632a]"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Sincronizando Reservas
            </p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="md:col-span-2 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-20 text-center">
            <WalletCards size={48} className="mx-auto text-slate-700 mb-6" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">
              Mês operacional sem caixinhas.
            </h3>
            <p className="text-slate-600 mb-10 text-sm max-w-xs mx-auto">
              Você pode iniciar uma nova do zero ou importar as configurações do
              mês anterior.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setEditingReservation(null);
                  setIsFormOpen(true);
                }}
                className="w-full sm:w-auto px-10 py-4 bg-[#ff632a] text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff632a]/80 transition-all"
              >
                Nova do Zero
              </button>
              <button
                onClick={openImportModal}
                className="w-full sm:w-auto px-10 py-4 border border-white/10 text-slate-400 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Importar Anterior
              </button>
            </div>
          </div>
        ) : (
          reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl hover:border-white/20 transition-all group overflow-hidden relative"
            >
              {/* Header: Title & Actions */}
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 text-[#ff632a] flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <WalletCards size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">
                      {res.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      Referência:{" "}
                      {format(new Date(res.created_at), "MMM yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditReservation(res)}
                    className="p-3 text-slate-600 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Data Visualization & Stats */}
              <div className="flex flex-col lg:flex-row gap-10 items-center mb-10 relative z-10">
                <div className="w-48 h-48 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: "Consumido", value: res.spent_amount },
                          {
                            name: "Disponível",
                            value: Math.max(0, res.remaining_amount),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell
                          fill={
                            res.remaining_amount <= 0 ? "#f43f5e" : "#ff632a"
                          }
                        />
                        <Cell fill="rgba(255,255,255,0.05)" stroke="none" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#fff", fontSize: "10px" }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                      Utilizado
                    </p>
                    <p className="text-xl font-bold text-white">
                      {res.total_amount > 0
                        ? ((res.spent_amount / res.total_amount) * 100).toFixed(
                            0,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                        Status de Execução
                      </p>
                      <p
                        className={`text-[10px] font-black font-mono ${res.remaining_amount <= 0 ? "text-rose-500" : "text-[#ff632a]"}`}
                      >
                        {res.remaining_amount <= 0
                          ? "LIMITE EXCEDIDO"
                          : "DENTRO DO APORTE"}
                      </p>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${res.remaining_amount <= 0 ? "bg-rose-500" : "bg-[#ff632a]"}`}
                        style={{
                          width: `${Math.min((res.spent_amount / res.total_amount) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest mb-1.5">
                        Consumido
                      </p>
                      <p className="text-lg font-bold text-white tracking-tight">
                        {formatCurrency(res.spent_amount)}
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold uppercase text-slate-600 tracking-widest mb-1.5">
                        Resíduo
                      </p>
                      <p
                        className={`text-lg font-bold tracking-tight ${res.remaining_amount <= 0 ? "text-rose-500" : "text-[#ff632a]"}`}
                      >
                        {formatCurrency(res.remaining_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Expense Form/Button */}
              <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                {expenseFormReservationId === res.id ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2 bg-black/40 p-6 rounded-2xl border border-[#ff632a]/20 shadow-2xl shadow-orange-500/5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff632a] mb-2">
                      Registrar Novo Gasto
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Descrição (ex: Mecânico)"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#ff632a] placeholder:text-slate-700 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Valor R$ 0,00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-[#ff632a] placeholder:text-slate-700 transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        disabled={isSubmittingExpense}
                        onClick={() => handleQuickExpense(res)}
                        className="flex-1 h-14 bg-[#ff632a] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#ff632a]/80 transition-all disabled:opacity-50"
                      >
                        {isSubmittingExpense
                          ? "Wait..."
                          : "Confirmar Lançamento"}
                      </button>
                      <button
                        onClick={() => setExpenseFormReservationId(null)}
                        className="px-6 h-14 bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpenseFormReservationId(res.id)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#ff632a] hover:border-[#ff632a] transition-all flex items-center justify-center gap-4 group/btn"
                  >
                    <PlusCircle
                      size={20}
                      className="text-[#ff632a] group-hover/btn:text-white transition-colors"
                    />
                    <span>Lançar Gasto no Pote</span>
                  </button>
                )}
              </div>

              {/* Collapsible History Section */}
              {res.transactions && res.transactions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                  <button
                    onClick={() =>
                      setExpandedHistory({
                        ...expandedHistory,
                        [res.id]: !expandedHistory[res.id],
                      })
                    }
                    className="w-full flex items-center justify-between py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-[#ff632a] transition-all group/hist"
                  >
                    <span className="flex items-center gap-3">
                      Histórico de Utilização
                      <span className="bg-white/5 px-2.5 py-1 rounded-lg text-slate-600 group-hover/hist:bg-[#ff632a]/10 group-hover/hist:text-[#ff632a] transition-all">
                        {res.transactions.length}
                      </span>
                    </span>
                    {expandedHistory[res.id] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {expandedHistory[res.id] && (
                    <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-top-4 duration-500">
                      {res.transactions.map((t: Transaction) => (
                        <div
                          key={t.id}
                          className="group/item relative bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                        >
                          {editingTransactionId === t.id ? (
                            <div className="space-y-4 animate-in slide-in-from-top-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      description: e.target.value,
                                    })
                                  }
                                  className="bg-black/40 border border-[#ff632a]/30 rounded-lg p-2 text-xs font-bold text-white outline-none"
                                />
                                <input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      amount: e.target.value,
                                    })
                                  }
                                  className="bg-black/40 border border-[#ff632a]/30 rounded-lg p-2 text-xs font-bold text-white outline-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateTransaction(t.id)}
                                  className="flex-1 bg-white text-black text-[9px] font-bold uppercase py-2 rounded-lg hover:bg-[#ff632a] hover:text-white transition-all"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingTransactionId(null)}
                                  className="px-4 bg-white/5 text-slate-500 text-[9px] font-bold uppercase py-2 rounded-lg"
                                >
                                  Voltar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                                  <TrendingDown size={14} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white leading-none mb-1">
                                    {t.description}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                    {format(
                                      new Date(t.due_date),
                                      "dd MMM yyyy",
                                      { locale: ptBR },
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm font-bold text-white">
                                  -{formatCurrency(t.amount)}
                                </p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditTransaction(t)}
                                    className="p-2 text-slate-600 hover:text-white transition-all"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteTransaction(t.id)
                                    }
                                    className="p-2 text-slate-600 hover:text-rose-500 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff632a]/5 rounded-full blur-[60px] group-hover:bg-[#ff632a]/10 transition-all duration-1000 -z-10"></div>
            </div>
          ))
        )}
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsImporting(false)}
          ></div>
          <div className="relative bg-[#020617] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-white/5">
              <div className="flex items-center gap-4 mb-2">
                <History className="text-[#ff632a]" />
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Restauração Patrimonial
                </h3>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Selecione as caixinhas que deseja renovar para este mês.
              </p>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              {pastReservations.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Nenhum registro encontrado no mÃªs anterior.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pastReservations.map((res) => (
                    <div
                      key={res.id}
                      className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-[#ff632a]/30 transition-all"
                    >
                      <div>
                        <p className="text-white font-bold group-hover:text-[#ff632a] transition-colors">
                          {res.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Valor Reservado: {formatCurrency(res.total_amount)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleImportReservations([res])}
                        className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-[#ff632a] hover:text-white transition-all active:scale-95"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                  <div className="mt-8">
                    <button
                      onClick={() => handleImportReservations(pastReservations)}
                      className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#ff632a] hover:text-white transition-all"
                    >
                      Importar Todas as {pastReservations.length} Caixinhas
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-black/40 text-center">
              <button
                onClick={() => setIsImporting(false)}
                className="text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all"
              >
                Fechar Assistente
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ReservationForm
          reservation={editingReservation || undefined}
          onReservationAdded={fetchReservations}
          onClose={() => {
            setIsFormOpen(false);
            setEditingReservation(null);
          }}
          selectedMonth={selectedMonth}
        />
      )}

      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        description={dialogConfig.description}
        variant={dialogConfig.variant}
      />
    </div>
  );
}
