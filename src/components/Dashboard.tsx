import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Flame, 
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  CreditCard
} from "lucide-react";
import { formatCurrency } from "../helpers/currency-formater";
import { Transaction } from "../types";

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Chart data
  const mainChartData = [
    { name: "Receitas", amount: totalIncome, fill: "url(#incomeGradient)" },
    { name: "Despesas", amount: totalExpenses, fill: "url(#expenseGradient)" },
    { name: "Saldo", amount: balance, fill: "url(#balanceGradient)" },
  ];

  // Category breakdown data
  const categoryData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 5);

  const COLORS = ['#ff632a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const healthScore = Math.max(0, Math.min(100, (savingsRate * 2) + 20));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h2 className="text-[10px] font-bold text-[#ff632a] uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
               <Sparkles size={14} /> Atividade Residual
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none mb-2">
               Fluxo de <span className="text-slate-500 italic">Capital</span>
            </h1>
         </div>
         <div className="flex items-center gap-3 bg-white/5 p-4 px-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-[#ff632a]/10 text-[#ff632a] flex items-center justify-center border border-[#ff632a]/20">
               <Flame size={20} />
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">Governança Fiscal</p>
               <p className="text-sm font-bold text-white leading-none">{healthScore >= 70 ? 'Alto Desempenho' : healthScore >= 40 ? 'Estável' : 'Atenção Necessária'}</p>
            </div>
         </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: "Aportes e Ganhos", 
            value: totalIncome, 
            icon: <TrendingUp size={24} />, 
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
            type: "income"
          },
          { 
            label: "Saídas de Capital", 
            value: totalExpenses, 
            icon: <TrendingDown size={24} />, 
            color: "text-rose-400",
            bg: "bg-rose-400/10",
            border: "border-rose-400/20",
            type: "expense"
          },
          { 
            label: "Saldo Acumulado", 
            value: balance, 
            icon: <CreditCard size={24} />, 
            color: "text-white",
            bg: "bg-[#ff632a]",
            border: "border-orange-400/30",
            type: "balance"
          }
        ].map((card, i) => (
          <div key={i} className="relative group">
            <div className={`relative ${card.type === 'balance' ? 'bg-[#ff632a] shadow-2xl shadow-orange-500/20' : 'bg-white/5 backdrop-blur-3xl'} p-8 rounded-3xl border ${card.type === 'balance' ? card.border : 'border-white/10'} hover:border-white/20 transition-all duration-500 flex flex-col h-full overflow-hidden`}>
               {card.type === 'balance' && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>}
               <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className={`p-4 rounded-xl ${card.type === 'balance' ? 'bg-white/10 text-white' : card.bg + ' ' + card.color}`}>
                    {card.icon}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg ${card.type === 'balance' ? 'bg-black/10 text-white/80' : 'bg-white/5 text-slate-500'}`}>
                    Exercício
                  </div>
               </div>
               <div className="mt-auto relative z-10">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${card.type === 'balance' ? 'text-white/70' : 'text-slate-500'}`}>{card.label}</p>
                  <p className={`text-4xl font-bold tracking-tight ${card.type === 'balance' ? 'text-white' : 'text-white'}`}>
                    {formatCurrency(card.value)}
                  </p>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Comparison Chart Container */}
        <div className="lg:col-span-8 bg-white/5 backdrop-blur-3xl p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                 <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Performance Residual</h3>
                 <p className="text-sm font-medium text-slate-500 tracking-tight">Distribuição de fluxos e retenção líquida.</p>
              </div>
           </div>

           <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mainChartData} barSize={64} barGap={12}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff632a" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                    contentStyle={{ 
                      borderRadius: '20px', 
                      backgroundColor: '#020617',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 1)',
                      padding: '20px'
                    }}
                    itemStyle={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 8, 8]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Small Widgets Column */}
        <div className="lg:col-span-4 space-y-10">
           
           {/* Achievement Widget */}
           <div className="bg-[#ff632a] p-10 rounded-3xl text-white overflow-hidden relative group shadow-2xl shadow-orange-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                 <div className="p-3 bg-white/10 w-fit rounded-xl mb-10 border border-white/20">
                    <Trophy size={20} />
                 </div>
                 <h4 className="text-xl font-bold mb-2">Metas Patrimoniais</h4>
                 <p className="text-white/70 text-sm mb-8 font-medium">Taxa de retenção sobre aportes</p>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-4xl font-bold text-white tracking-tight">{savingsRate.toFixed(1)}%</span>
                       <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Eficiência G4</span>
                    </div>
                    <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(savingsRate, 100)}%` }}
                       ></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Category Distribution Widget */}
           <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <PieIcon size={18} />
                 </div>
                 <h4 className="font-bold text-white tracking-tight text-lg">Setores de Alocação</h4>
              </div>

              {categoryData.length > 0 ? (
                <div className="space-y-6">
                   {categoryData.map((item, i) => (
                      <div key={i}>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                            <span className="text-xs font-bold text-white">{formatCurrency(item.value)}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-1000 ease-out" 
                              style={{ 
                                width: `${(item.value / totalExpenses) * 100}%`,
                                backgroundColor: COLORS[i % COLORS.length] 
                              }}
                            ></div>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="text-center py-10">
                   <p className="text-xs font-bold text-slate-500 italic">Dados inexistentes no período.</p>
                </div>
              )}

              <button className="w-full mt-10 py-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5 group">
                 Auditoria Completa <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
