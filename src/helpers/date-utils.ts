import { addMonths, format as dateFnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Cria um objeto Date seguro a partir de uma string YYYY-MM-DD
 * ForÃ§a o horÃ¡rio para o meio do dia para evitar que o fuso horÃ¡rio mude o dia.
 */
export const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  // Se jÃ¡ for uma string no formato ISO simplificado, adicionamos o horário do meio do dia
  return new Date(`${dateStr.split('T')[0]}T12:00:00`);
};

/**
 * Formata uma string de data do banco para exibiÃ§Ã£o no formato brasileiro
 */
export const formatDisplayDate = (dateStr: string, formatStr: string = "dd/MM/yyyy") => {
  const date = parseSafeDate(dateStr);
  return dateFnsFormat(date, formatStr, { locale: ptBR });
};

/**
 * Adiciona meses a uma data considerando o fuso horÃ¡rio local
 */
export const addMonthsSafe = (dateStr: string, months: number) => {
  const date = parseSafeDate(dateStr);
  const newDate = addMonths(date, months);
  return dateFnsFormat(newDate, "yyyy-MM-dd");
};
