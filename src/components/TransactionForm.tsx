import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

interface TransactionFormProps {
  onTransactionAdded: () => void;
  selectedMonth: Date;
}

export function TransactionForm({
  onTransactionAdded,
  selectedMonth,
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState(format(selectedMonth, 'yyyy-MM-dd'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("transactions").insert([
      {
        type,
        amount: parseFloat(amount),
        description,
        category,
        due_date: dueDate,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      },
    ]);

    if (!error) {
      setAmount("");
      setDescription("");
      setCategory("");
      setDueDate("");
      onTransactionAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Adicionar Nova Transação</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          type="button"
          className={`p-2 rounded ${
            type === "income" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setType("income")}
        >
          Receita
        </button>
        <button
          type="button"
          className={`p-2 rounded ${
            type === "expense" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setType("expense")}
        >
          Despesa
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Valor
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Vencimento
          </label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ff632a] hover:bg-[#ff632a]/80"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Transação
        </button>
      </div>
    </form>
  );
}
