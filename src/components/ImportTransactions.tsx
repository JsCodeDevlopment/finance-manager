import { Dialog, Transition } from "@headlessui/react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Check, Copy, Import, Tag, Wallet, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { formatCurrency } from "../helpers/currency-formater";
import { supabase } from "../lib/supabase";
import { Transaction } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface ImportTransactionsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: Date;
  onTransactionsImported: () => void;
}

export function ImportTransactions({
  isOpen,
  onClose,
  selectedMonth,
  onTransactionsImported,
}: ImportTransactionsProps) {
  const [previousTransactions, setPreviousTransactions] = useState<
    Transaction[]
  >([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
  );
  const [importing, setImporting] = useState(false);
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

  const fetchPreviousMonthTransactions = useCallback(async () => {
    const previousMonth = subMonths(selectedMonth, 1);
    const startDate = format(startOfMonth(previousMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(previousMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("due_date", startDate)
      .lte("due_date", endDate)
      .order("due_date", { ascending: true });

    if (data) {
      setPreviousTransactions(data as Transaction[]);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (isOpen) {
      fetchPreviousMonthTransactions();
    }
  }, [isOpen, fetchPreviousMonthTransactions]);

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    const allIds = previousTransactions.map((t) => t.id);
    setSelectedTransactions(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const handleClose = () => {
    setSelectedTransactions(new Set());
    onClose();
  };

  const importSelectedTransactions = async () => {
    setImporting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const selectedTransactionsData = previousTransactions
        .filter((t) => selectedTransactions.has(t.id))
        .map((t) => ({
          type: t.type,
          amount: t.amount,
          description: t.description,
          category: t.category,
          due_date: format(selectedMonth, "yyyy-MM-dd"), // selectedMonth jÃ¡ vem como Date do TransactionsPage
          user_id: user.id,
          is_paid: false,
        }));

      if (selectedTransactionsData.length > 0) {
        const { error } = await supabase
          .from("transactions")
          .insert(selectedTransactionsData);

        if (!error) {
          onTransactionsImported();
          handleClose();
        } else {
          throw error;
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      setDialogConfig({
        isOpen: true,
        title: "Erro na Importação",
        description: "Não foi possível importar os lançamentos: " + err.message,
        variant: "danger",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[2.5rem] bg-[#020617] p-10 text-left align-middle shadow-2xl transition-all border border-white/10 relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff632a]/5 blur-[80px] rounded-full -z-10"></div>

                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-[#ff632a] flex items-center justify-center shadow-inner">
                        <Import size={28} />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-3xl font-bold text-white tracking-tight leading-none mb-3"
                        >
                          Importar Dados
                        </Dialog.Title>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          Sincronização de registros operacionais
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {previousTransactions.length === 0 ? (
                    <div className="bg-white/5 p-16 rounded-[2.5rem] text-center border border-dashed border-white/10">
                      <div className="flex flex-col items-center gap-6 text-slate-700">
                        <Wallet size={56} strokeWidth={1} />
                        <div className="space-y-2">
                          <p className="font-bold text-white text-lg">
                            Histórico Indisponível
                          </p>
                          <p className="text-sm text-slate-500 font-medium">
                            Não identificamos transações no período anterior
                            para replicação.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          {previousTransactions.length} registros identificados
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={selectAll}
                            className="px-4 py-2 text-[9px] font-bold text-[#ff632a] bg-[#ff632a]/10 border border-[#ff632a]/20 rounded-lg hover:bg-[#ff632a]/20 transition-all uppercase tracking-widest"
                          >
                            Selecionar Tudo
                          </button>
                          <button
                            onClick={deselectAll}
                            className="px-4 py-2 text-[9px] font-bold text-slate-500 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[380px] overflow-y-auto px-1 pr-4 custom-scrollbar mb-10">
                        {previousTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
                              selectedTransactions.has(transaction.id)
                                ? "bg-white/10 border-[#ff632a]/50 shadow-2xl shadow-orange-500/5"
                                : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30"
                            }`}
                            onClick={() => toggleTransaction(transaction.id)}
                          >
                            <div className="flex items-center gap-5 relative z-10">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  transaction.type === "income"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                              >
                                {selectedTransactions.has(transaction.id) ? (
                                  <Check size={24} />
                                ) : (
                                  <Copy size={18} className="opacity-40" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white tracking-tight mb-2 group-hover:text-[#ff632a] transition-colors leading-none uppercase text-sm">
                                  {transaction.description}
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                                  <Tag size={10} className="text-[#ff632a]" />{" "}
                                  {transaction.category}
                                </p>
                              </div>
                            </div>
                            <div className="text-right relative z-10">
                              <p
                                className={`text-lg font-bold tracking-tight ${
                                  transaction.type === "income"
                                    ? "text-emerald-400"
                                    : "text-white"
                                }`}
                              >
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            {selectedTransactions.has(transaction.id) && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff632a]/5 blur-[30px] rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={importSelectedTransactions}
                        disabled={selectedTransactions.size === 0 || importing}
                        className="w-full h-16 flex items-center justify-center gap-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-[0.25em] hover:bg-[#ff632a] hover:text-white transition-all transform active:scale-95 shadow-2xl disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                      >
                        {importing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            <Check size={20} />
                            Finalizar Importação ({selectedTransactions.size})
                          </>
                        )}
                      </button>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
        title={dialogConfig.title}
        description={dialogConfig.description}
        variant={dialogConfig.variant}
      />
    </>
  );
}
