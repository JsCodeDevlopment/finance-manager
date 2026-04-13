-- Adicionar coluna de mÃªs de competÃªncia na tabela de reservas
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS month_date date;

-- Preencher registros antigos com o mÃªs baseado no created_at (opcional, para nÃ£o quebrar dados existentes)
UPDATE reservations SET month_date = date_trunc('month', created_at)::date WHERE month_date IS NULL;

-- Tornar obrigatÃ³rio se desejar (opcional, vamos deixar opcional por enquanto para compatibilidade)
-- ALTER TABLE reservations ALTER COLUMN month_date SET NOT NULL;
