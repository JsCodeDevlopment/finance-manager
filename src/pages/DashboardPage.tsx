import { useEffect, useState, useCallback } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Transaction } from "../types";
import { Dashboard } from "../components/Dashboard";
import { MonthSelector } from "../components/MonthSelector";
import { supabase } from "../lib/supabase";

export function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("due_date", startDate)
      .lte("due_date", endDate)
      .order("due_date", { ascending: true });

    if (data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Resumo Operacional</h1>
          <p className="text-slate-400 font-medium">Análise consolidada de performance e fluxo de caixa.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-2 px-4 rounded-2xl border border-white/10 shadow-2xl">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff632a]"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Dados</p>
        </div>
      ) : (
        <Dashboard transactions={transactions} />
      )}
    </div>
  );
}
