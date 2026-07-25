-- ============================================================
-- COPA ASTÃO / ASTON VINA - SCHEMA COMPLETO PARA SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  countdown_date TIMESTAMPTZ DEFAULT '2026-11-01T08:00:00Z',
  active_championship_id TEXT DEFAULT 'copa-astao-2026',
  logo_url TEXT DEFAULT '/copa26.png',
  album_background_url TEXT DEFAULT '',
  ranking_background_url TEXT DEFAULT '',
  global_background_url TEXT DEFAULT '',
  teams JSONB DEFAULT '[]'::jsonb,
  countdown_config JSONB DEFAULT '{}'::jsonb,
  rewards_banner_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insere as configurações padrão se a tabela estiver vazia
INSERT INTO system_settings (id, logo_url, teams)
VALUES (
  'default',
  '/copa26.png',
  '[
    {"id": "team-vermelho", "name": "Time Vermelho", "color": "#EF4444", "shieldUrl": "/escudo3atual2.png"},
    {"id": "team-azul", "name": "Time Azul", "color": "#3B82F6", "shieldUrl": "/escudo1atual.png"},
    {"id": "team-branco", "name": "Time Branco", "color": "#F8FAFC", "shieldUrl": "/escudobranco.png"},
    {"id": "team-preto", "name": "Time Preto", "color": "#1E293B", "shieldUrl": "/escudopreto.png"}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Jogadores / Usuários Colecionadores
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT DEFAULT '123456',
  team_id TEXT,
  position TEXT,
  avatar_url TEXT DEFAULT '/default-avatar.png',
  packs_opened INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Figurinhas
CREATE TABLE IF NOT EXISTS stickers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  number INTEGER NOT NULL,
  player_id TEXT,
  team_id TEXT NOT NULL,
  rarity TEXT DEFAULT 'commum',
  category TEXT DEFAULT 'jogador',
  photo_url TEXT DEFAULT '',
  is_golden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela da Coleção de Figurinhas dos Jogadores
CREATE TABLE IF NOT EXISTS user_stickers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sticker_id TEXT NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_sticker UNIQUE (user_id, sticker_id)
);

-- 5. Tabela de Premiações
CREATE TABLE IF NOT EXISTS prizes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  delivery_criteria TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insere prêmios demonstrativos
INSERT INTO prizes (id, name, description, quantity, delivery_criteria, image_url)
VALUES
  ('prize-1', '1 Mês de Futebol Grátis', 'Isenção completa da mensalidade por 30 dias', 1, '1º Lugar Geral do Ranking', '/copa26.png'),
  ('prize-2', 'Camisa Oficial Aston Vina', 'Manto oficial do clube personalizado com nome', 3, 'Top 3 Colecionadores', '/copa26.png'),
  ('prize-3', 'Boné Oficial Aston Vina', 'Boné exclusivo edição limitada Copa Astão', 5, 'Sorteio entre quem completar o álbum', '/copa26.png')
ON CONFLICT (id) DO NOTHING;

-- 6. Tabela de Logs do Sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- Habilita acesso de leitura pública nas tabelas principais
-- ============================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Permitir Leitura Pública em Configurações" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Permitir Leitura Pública de Jogadores" ON players FOR SELECT USING (true);
CREATE POLICY "Permitir Leitura Pública de Figurinhas" ON stickers FOR SELECT USING (true);
CREATE POLICY "Permitir Leitura Pública de Coleções" ON user_stickers FOR SELECT USING (true);
CREATE POLICY "Permitir Leitura Pública de Prêmios" ON prizes FOR SELECT USING (true);

-- Permitir Inserções e Atualizações gerais (pela Service Role API ou anon durante testes)
CREATE POLICY "Permitir Escrita Geral em Configurações" ON system_settings FOR ALL USING (true);
CREATE POLICY "Permitir Escrita Geral em Jogadores" ON players FOR ALL USING (true);
CREATE POLICY "Permitir Escrita Geral em Figurinhas" ON stickers FOR ALL USING (true);
CREATE POLICY "Permitir Escrita Geral em Coleções" ON user_stickers FOR ALL USING (true);
CREATE POLICY "Permitir Escrita Geral em Prêmios" ON prizes FOR ALL USING (true);

-- ============================================================
-- BUCKETS DE STORAGE DO SUPABASE (Crie no painel do Supabase)
-- Buckets públicos recomendados:
-- 1. banner
-- 2. logos
-- 3. stickers
-- 4. players
-- 5. teams
-- 6. backgrounds
-- 7. albums
-- ============================================================
