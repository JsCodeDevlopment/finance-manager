/*
  # Finance Management Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text, either 'income' or 'expense')
      - `amount` (decimal)
      - `description` (text)
      - `category` (text)
      - `due_date` (date)
      - `is_paid` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `monthly_budgets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month` (date)
      - `expected_income` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount decimal NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text NOT NULL,
  due_date date NOT NULL,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monthly_budgets table
CREATE TABLE monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month date NOT NULL,
  expected_income decimal NOT NULL CHECK (expected_income >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for monthly_budgets
CREATE POLICY "Users can manage their own budgets"
  ON monthly_budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);