-- Criar tabela de cartÃµes de crÃ©dito
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  limit_amount decimal NOT NULL DEFAULT 0 CHECK (limit_amount >= 0),
  closing_day integer NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  color text DEFAULT '#ff632a',
  last_4 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar colunas de suporte a cartÃ£o e parcelamento na tabela de transaÃ§Ãµes
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='credit_card_id') THEN
    ALTER TABLE transactions ADD COLUMN credit_card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='installment_number') THEN
    ALTER TABLE transactions ADD COLUMN installment_number integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='total_installments') THEN
    ALTER TABLE transactions ADD COLUMN total_installments integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND COLUMN_NAME='installment_group_id') THEN
    ALTER TABLE transactions ADD COLUMN installment_group_id uuid;
  END IF;
END $$;

-- Ativar RLS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- PolÃticas para credit_cards
CREATE POLICY "Users can manage their own credit cards"
  ON credit_cards
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
