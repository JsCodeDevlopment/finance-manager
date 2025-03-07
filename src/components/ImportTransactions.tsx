import { Dialog, Transition } from "@headlessui/react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Check, Copy, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  due_date: string;
  is_paid: boolean;
}

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
    new Set()
  );
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreviousMonthTransactions();
    }
  }, [isOpen, selectedMonth]);

  const fetchPreviousMonthTransactions = async () => {
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
      setPreviousTransactions(data);
    }
  };

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
          due_date: format(selectedMonth, "yyyy-MM-dd"),
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
    } catch (error) {
      alert("Error importing transactions: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex justify-between items-center mb-4"
                >
                  <h3 className="text-xl font-semibold">
                    Importar do Mês Anterior
                  </h3>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Title>

                {previousTransactions.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    Nenhuma transação encontrada no mês anterior
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end space-x-2 mb-4">
                      <button
                        onClick={selectAll}
                        className="px-3 py-1 text-sm text-white bg-[#ff632a] hover:bg-gray-300 hover:text-black rounded"
                      >
                        Selecionar Todas
                      </button>
                      <button
                        onClick={deselectAll}
                        className="px-3 py-1 text-sm text-[#ff632a] border border-[#ff632a] hover:bg-gray-50 rounded"
                      >
                        Desmarcar Todas
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {previousTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={`flex items-center justify-between p-3 rounded cursor-pointer ${
                            selectedTransactions.has(transaction.id)
                              ? "bg-[#ff632a]/10 border border-[#ff632a]/30"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                          onClick={() => toggleTransaction(transaction.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(transaction.id)}
                              onChange={() => toggleTransaction(transaction.id)}
                              className="h-4 w-4 text-[#ff632a] rounded"
                            />
                            <div>
                              <p className="font-medium">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className={`font-medium ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              R${transaction.amount.toFixed(2)}
                            </span>
                            <Copy className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={importSelectedTransactions}
                        disabled={selectedTransactions.size === 0 || importing}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white ${
                          selectedTransactions.size === 0 || importing
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-[#ff632a] hover:bg-[#ff632a]/80"
                        }`}
                      >
                        {importing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Importar Selecionadas ({selectedTransactions.size})
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
