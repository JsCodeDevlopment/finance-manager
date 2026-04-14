export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  due_date: string;
  is_paid: boolean;
  reservation_id?: string;
  credit_card_id?: string;
  installment_number?: number;
  total_installments?: number;
  installment_group_id?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  created_at: string;
  month_date?: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
  color: string;
  last_4?: string;
  created_at: string;
  total_debt?: number; // Total committed debt (all unpaid)
  available_limit?: number; // Calculated field
  current_bill?: number; // Sum of unpaid transactions for current month
}
