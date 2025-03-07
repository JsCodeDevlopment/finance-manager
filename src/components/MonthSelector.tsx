import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({
  selectedMonth,
  onMonthChange,
}: MonthSelectorProps) {
  const handlePreviousMonth = () => {
    onMonthChange(addMonths(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-6">
      <button
        onClick={handlePreviousMonth}
        className="p-2 bg-[#ff632a] text-white hover:bg-gray-100 hover:text-black rounded-full transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <h2 className="text-xl font-semibold">
        {format(selectedMonth, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
      </h2>

      <button
        onClick={handleNextMonth}
        className="p-2 bg-[#ff632a] text-white hover:bg-gray-100 hover:text-black rounded-full transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
