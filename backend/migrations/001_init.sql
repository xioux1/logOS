CREATE SCHEMA IF NOT EXISTS logos;

CREATE TABLE IF NOT EXISTS logos.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logos.federated_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logos_user_id UUID REFERENCES logos.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

CREATE TABLE IF NOT EXISTS logos.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES logos.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logos.structured_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES logos.logs(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  tags TEXT[],
  priority VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logos.conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES logos.users(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  raw_history JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logos.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES logos.structured_entries(id) ON DELETE CASCADE,
  system VARCHAR(50) NOT NULL,
  external_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
