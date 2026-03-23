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
}
