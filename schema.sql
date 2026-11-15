CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  vault_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  reset_code_hash TEXT,
  reset_expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
