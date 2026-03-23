import { useEffect, useState, useCallback } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Plus, Import, Sparkles, Filter, ReceiptText } from "lucide-react";
import { Transaction } from "../types";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { ImportTransactions } from "../components/ImportTransactions";
import { MonthSelector } from "../components/MonthSelector";
import { supabase } from "../lib/supabase";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [isImportOpen, setIsImportOpen] = useState(false);
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 relative">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
             Controle de <span className="text-slate-500 italic">Fluxo</span>
          </h1>
          <p className="text-slate-400 font-bold flex items-center gap-2 ml-1 text-sm tracking-tight">
            <Sparkles size={16} className="text-[#ff632a]" />
            Gerenciamento detalhado de cada unidade patrimonial.
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
            onClick={() => setIsImportOpen(true)}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-slate-400 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95 text-xs uppercase tracking-widest"
          >
            <Import size={18} className="group-hover:-translate-y-1 transition-transform" />
            <span>Importar Dados</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Left Column - Form Widget */}
        <div className="xl:col-span-4 sticky top-12 z-10">
           <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-12">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ff632a]/10 text-[#ff632a] border border-[#ff632a]/20">
                      <Plus size={32} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">Novo Registro</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Lançamento Operacional</p>
                  </div>
                </div>
                
                <TransactionForm
                  onTransactionAdded={fetchTransactions}
                  selectedMonth={selectedMonth}
                />

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center gap-3 text-slate-500">
                   <ReceiptText size={16} />
                   <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none">Rastreamento de ativos e passivos</p>
                </div>
              </div>
           </div>
        </div>
        
        {/* Right Column - List Container */}
        <div className="xl:col-span-8">
            <div className="flex items-center justify-between mb-10 px-4">
               <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-4">
                  Registros do Período <span className="bg-white/5 text-slate-500 p-1.5 px-4 rounded-xl text-[10px] font-bold tracking-widest">{transactions.length}</span>
               </h3>
               <div className="flex items-center gap-2 text-slate-500">
                  <Filter size={18} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em]">Filtros Ativos</span>
               </div>
            </div>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 animate-pulse">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff632a] mb-6"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Banco de Dados...</p>
                </div>
            ) : (
                <TransactionList
                    transactions={transactions}
                    onTransactionUpdated={fetchTransactions}
                />
            )}
        </div>
      </div>

      <ImportTransactions
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        selectedMonth={selectedMonth}
        onTransactionsImported={fetchTransactions}
      />
    </div>
  );
}
