-- Adiciona campos de CRM à tabela clientes: estágio no funil, tags e notas internas.
-- Rode este script no banco antes de usar as novas funcionalidades de cliente.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS status_funil VARCHAR(20) NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notas TEXT;

ALTER TABLE clientes
  ADD CONSTRAINT clientes_status_funil_check
  CHECK (status_funil IN ('novo', 'ativo', 'recorrente', 'inativo'));
