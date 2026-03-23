/*
  # Reservas de Dinheiro (Uso do Dinheiro)

  1. Novas Tabelas
    - `reservations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, e.g., "Combustível")
      - `total_amount` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Alterações
    - Adição de `reservation_id` (uuid) na tabela `transactions` para vincular gastos a uma reserva.

  3. Segurança
    - Enable RLS na tabela `reservations`
    - Políticas para usuários gerenciarem suas próprias reservas
*/

-- Criar tabela de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  total_amount decimal NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar coluna de vínculo na tabela de transações
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='reservation_id') THEN
    ALTER TABLE transactions ADD COLUMN reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ativar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own reservations"
  ON reservations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
