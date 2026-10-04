-- Magica Database Schema for Supabase
-- Simple structure: players + battle logs

-- ============================================================
-- 1. Players Table
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on nickname for quick lookup
CREATE INDEX IF NOT EXISTS idx_players_nickname ON players(nickname);

-- ============================================================
-- 2. Matches Table
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  is_draw BOOLEAN DEFAULT FALSE,
  turn_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- ============================================================
-- 3. Battle Log Table
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  actor_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  spell_name VARCHAR(50),
  target_id UUID REFERENCES players(id) ON DELETE SET NULL,
  hp_before INT,
  hp_after INT,
  mana_before INT,
  mana_after INT,
  damage_dealt INT,
  healing_amount INT,
  status_effects VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_battle_logs_match ON battle_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_actor ON battle_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_turn ON battle_logs(match_id, turn_number);

-- ============================================================
-- 4. RLS (Row Level Security) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;

-- Players: Everyone can read, no one can modify (for now)
CREATE POLICY players_select_policy ON players
  FOR SELECT
  USING (true);

CREATE POLICY players_insert_policy ON players
  FOR INSERT
  WITH CHECK (true);

-- Matches: Everyone can read all matches
CREATE POLICY matches_select_policy ON matches
  FOR SELECT
  USING (true);

CREATE POLICY matches_insert_policy ON matches
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY matches_update_policy ON matches
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Battle Logs: Everyone can read all logs
CREATE POLICY battle_logs_select_policy ON battle_logs
  FOR SELECT
  USING (true);

CREATE POLICY battle_logs_insert_policy ON battle_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. Helper Views
-- ============================================================

-- View for match statistics
CREATE OR REPLACE VIEW match_stats AS
SELECT 
  p.id,
  p.nickname,
  COUNT(m.id) as total_matches,
  COUNT(CASE WHEN m.winner_id = p.id THEN 1 END) as wins,
  COUNT(CASE WHEN m.is_draw = true AND (m.player1_id = p.id OR m.player2_id = p.id) THEN 1 END) as draws,
  COUNT(CASE WHEN m.winner_id != p.id AND m.is_draw = false AND (m.player1_id = p.id OR m.player2_id = p.id) THEN 1 END) as losses
FROM players p
LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
GROUP BY p.id, p.nickname;

-- ============================================================
-- 6. Sample Data (Optional - for testing)
-- ============================================================

-- Uncomment to insert sample players:
-- INSERT INTO players (nickname) VALUES ('플레이어1'), ('플레이어2'), ('테스터') ON CONFLICT DO NOTHING;
