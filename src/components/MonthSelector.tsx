import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

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
    <div className="flex items-center gap-6 select-none">
      <button
        onClick={handlePreviousMonth}
        className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-500 hover:bg-[#ff632a] hover:text-white rounded-xl transition-all border border-white/5 active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex flex-col items-center min-w-[150px]">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-1">
           <CalendarDays size={10} />
           <span>Período Fiscal</span>
        </div>
        <h2 className="text-sm font-bold text-white tracking-tight capitalize group cursor-default">
          {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
      </div>

      <button
        onClick={handleNextMonth}
        className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-500 hover:bg-[#ff632a] hover:text-white rounded-xl transition-all border border-white/5 active:scale-95"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
