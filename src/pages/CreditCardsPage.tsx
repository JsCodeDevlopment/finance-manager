import { addMonths, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CreditCard as CardIcon,
  Clock,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Pie,
  AreaChart as ReAreaChart,
  BarChart as ReBarChart,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { CreditCardCard } from "../components/CreditCardCard";
import { CreditCardDetailModal } from "../components/CreditCardDetailModal";
import { CreditCardForm } from "../components/CreditCardForm";
import { formatCurrency } from "../helpers/currency-formater";
import { supabase } from "../lib/supabase";
import { CreditCard, Transaction } from "../types";

const CustomTooltip = ({ active, payload, label, showTotal = false }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc: number, entry: any) => acc + (entry.value || 0), 0);
    return (
      <div className="bg-[#020617]/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl min-w-[220px] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
          {label || "Detalhamento"}
        </p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                  style={{ backgroundColor: entry.color || entry.payload?.fill || entry.fill || "#fff" }}
                ></div>
                <span className="text-[11px] font-bold text-white/90 truncate max-w-[140px]">
                  {entry.name}
                </span>
              </div>
              <span className="text-[11px] font-black text-white font-mono">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
        {showTotal && payload.length > 1 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[#ff632a] uppercase tracking-widest leading-none mb-1">
                Total Consolidado
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                Soma de todos os cartões
              </span>
            </div>
            <span className="text-sm font-black text-white font-mono">
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

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
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<
    { month: string; amount: number }[]
  >([]);
  const [futureProjection, setFutureProjection] = useState<any[]>([]);
  const [payoffTimeline, setPayoffTimeline] = useState<
    { name: string; color: string; endMonth: string }[]
  >([]);
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

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch Cards
    const { data: cardsData } = await supabase
      .from("credit_cards")
      .select("*")
      .order("name");

    if (cardsData) {
      // Fetch all transactions linked to cards from the last 6 months AND all future pending ones
      const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-01");

      // We fetch all pending transactions (no date limit) to see when debt ends
      const { data: transData } = await supabase
        .from("transactions")
        .select("*")
        .not("credit_card_id", "is", null)
        .or(`is_paid.eq.false,due_date.gte.${sixMonthsAgo}`);

      const currentMonth = format(new Date(), "yyyy-MM");

      const cardsWithDebt = cardsData.map((card: CreditCard) => {
        const cardTransactions =
          transData?.filter((t: Transaction) => t.credit_card_id === card.id) ||
          [];

        const unpaidTransactions = cardTransactions.filter(
          (t: Transaction) => !t.is_paid,
        );

        const totalDebt = unpaidTransactions
          .filter((t: Transaction) => !t.is_subscription)
          .reduce((sumValue: number, t: Transaction) => sumValue + t.amount, 0);

        // Subscriptions that are unpaid and due up to today
        const subscriptions = unpaidTransactions.filter(
          (t: Transaction) =>
            t.is_subscription && t.due_date <= format(new Date(), "yyyy-MM-dd"),
        );

        let currentBill = unpaidTransactions
          .filter(
            (t: Transaction) =>
              !t.is_subscription && t.due_date.startsWith(currentMonth),
          )
          .reduce((sumValue: number, t: Transaction) => sumValue + t.amount, 0);

        // Subscriptions only enter if there is limit
        subscriptions.forEach((sub: Transaction) => {
          if (currentBill + sub.amount <= card.limit_amount) {
            currentBill += sub.amount;
          }
        });

        // Also add current month's unpaid subscriptions to total debt to match Detail Modal
        const currentUnpaidSubs = subscriptions.reduce(
          (sumValue: number, t: Transaction) => sumValue + t.amount,
          0,
        );

        return {
          ...card,
          total_debt: totalDebt + currentUnpaidSubs,
          current_bill: currentBill,
          available_limit: card.limit_amount - (totalDebt + currentUnpaidSubs),
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

      // Calculate Monthly Trend (Last 6 Months)
      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return format(d, "yyyy-MM");
      });

      const trend = months.map((m) => {
        const monthTotal =
          transData
            ?.filter((t) => t.due_date.startsWith(m))
            .reduce((sum, t) => sum + t.amount, 0) || 0;
        return {
          month: format(parseISO(m + "-01"), "MMM", { locale: ptBR }),
          amount: monthTotal,
        };
      });
      setMonthlyTrend(trend);

      // Calculate future payoff projection (past 6 months + next 12 months)
      const projectionMonths = Array.from({ length: 18 }).map((_, i) => {
        const d = startOfMonth(addMonths(new Date(), i - 6));
        return format(d, "yyyy-MM");
      });

      const projection = projectionMonths.map((m) => {
        const monthData: any = {
          monthKey: m,
          month: format(parseISO(m + "-01"), "MMM yy", { locale: ptBR }),
          total: 0,
        };
        cardsWithDebt.forEach((card) => {
          const cardMonthTotal =
            transData
              ?.filter(
                (t) => t.credit_card_id === card.id && t.due_date.startsWith(m),
              )
              .reduce(
                (sumValue: number, t: Transaction) => sumValue + t.amount,
                0,
              ) || 0;

          monthData[card.name] = cardMonthTotal;
          monthData.total += cardMonthTotal;
        });
        return monthData;
      });
      setFutureProjection(projection);

      // Calculate when each card will be paid off
      const timeline = cardsWithDebt.map((card) => {
        const pending =
          transData?.filter(
            (t) => t.credit_card_id === card.id && !t.is_paid,
          ) || [];
        if (pending.length === 0)
          return { name: card.name, color: card.color, endMonth: "Quidado" };

        const dates = pending.map((t) => t.due_date);
        const lastDate = dates.sort().reverse()[0];
        const monthEnd = format(parseISO(lastDate), "MMMM yyyy", {
          locale: ptBR,
        });

        return {
          name: card.name,
          color: card.color,
          endMonth: monthEnd,
          endDate: parseISO(lastDate),
        };
      });
      setPayoffTimeline(timeline);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteCard = async (id: string) => {
    setDialogConfig({
      isOpen: true,
      title: "Remover Cartão",
      description:
        "Isso removerá o cartão do seu painel, mas as transações vinculadas permanecerão registradas. Continuar?",
      variant: "danger",
      onConfirm: async () => {
        const { error } = await supabase
          .from("credit_cards")
          .delete()
          .eq("id", id);
        if (!error) fetchData();
      },
    });
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsFormOpen(true);
  };

  const handlePayBill = async (cardId: string) => {
    const currentMonth = format(new Date(), "yyyy-MM");
    setDialogConfig({
      isOpen: true,
      title: "Liquidar Fatura",
      description: `Deseja marcar todos os lançamentos de ${currentMonth} deste cartão como pagos?`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("transactions")
          .update({ is_paid: true })
          .eq("credit_card_id", cardId)
          .like("due_date", `${currentMonth}%`);

        if (!error) fetchData();
      },
    });
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
          onClick={() => {
            setEditingCard(null);
            setIsFormOpen(true);
          }}
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

      {/* Analysis Grid */}
      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Pie Chart: Debt Distribution */}
          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff632a]/5 blur-[80px] rounded-full -z-10"></div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">
                  Distribuição de Dívida
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Comprometimento por Instituição
                </p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400">
                <CardIcon size={20} />
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={cards.filter((c) => (c.total_debt || 0) > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total_debt"
                  >
                    {cards.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {cards
                .filter((c) => (c.total_debt || 0) > 0)
                .map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: card.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate uppercase tracking-widest leading-none mb-1">
                        {card.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        {formatCurrency(card.total_debt || 0)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Bar Chart: Usage Ratio */}
          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -z-10"></div>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">
                  Saldo vs Limite
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Utilização relativa de cada cartão
                </p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={cards.map((c) => ({
                    name: c.name,
                    total_debt: c.total_debt,
                    limit_amount: c.limit_amount,
                    color: c.color,
                  }))}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={<CustomTooltip />} 
                  />
                  <Bar
                    dataKey="limit_amount"
                    fill="rgba(255,255,255,0.05)"
                    radius={[0, 10, 10, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="total_debt"
                    radius={[0, 10, 10, 0]}
                    barSize={24}
                  >
                    {cards.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Plus size={16} />
              </div>
              <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest">
                Dica: Tente não exceder 30% do limite total para manter uma boa
                pontuação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Future Payoff Projection */}
      {!loading && cards.length > 0 && (
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full -z-10"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-3">
                Cronograma e <span className="text-blue-400">Projeção</span>
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Fluxo de gastos mensal (histórico e parcelamentos ativos)
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {payoffTimeline.map((item) => (
                <div
                  key={item.name}
                  className="bg-white/5 px-5 py-3 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[80px]">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-white capitalize">
                    {item.endMonth}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReAreaChart
                data={futureProjection}
                margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
              >
                <defs>
                  {cards.map((card) => (
                    <linearGradient
                      key={`grad-${card.id}`}
                      id={`color-${card.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={card.color}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={card.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip showTotal={true} />} />
                {cards.map((card) => (
                  <Area
                    key={card.id}
                    stackId="1"
                    type="monotone"
                    dataKey={card.name}
                    stroke={card.color}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#color-${card.id})`}
                  />
                ))}
              </ReAreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-6">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Cenário Livre de Dívidas
                </p>
                <p className="text-lg font-bold text-white">
                  Estimado para{" "}
                  {payoffTimeline.sort(
                    (a, b) =>
                      (b.endDate?.getTime() || 0) - (a.endDate?.getTime() || 0),
                  )[0]?.endMonth || "---"}
                </p>
              </div>
            </div>
            <div className="p-6 bg-[#ff632a]/5 border border-[#ff632a]/10 rounded-3xl flex items-center gap-6">
              <div className="p-4 bg-[#ff632a]/10 text-[#ff632a] rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Pico de Desembolso
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(
                    Math.max(...futureProjection.map((p) => p.total)),
                  )}{" "}
                  em{" "}
                  {
                    futureProjection.find(
                      (p) =>
                        p.total ===
                        Math.max(...futureProjection.map((p) => p.total)),
                    )?.month
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              Centralize a gestão das suas faturas e limites para ter controle
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
              onEdit={handleEditCard}
              onPayBill={handlePayBill}
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
          key={editingCard?.id || "new-card"}
          card={editingCard || undefined}
          onCardAdded={fetchData}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCard(null);
          }}
        />
      )}

      {detailedCard && (
        <CreditCardDetailModal
          card={detailedCard}
          onClose={() => setDetailedCard(null)}
          onEdit={(card) => {
            setDetailedCard(null);
            handleEditCard(card);
          }}
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
