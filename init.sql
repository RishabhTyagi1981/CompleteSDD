CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE, password_hash VARCHAR(255), role VARCHAR(30));
INSERT INTO users (username, password_hash, role) VALUES ('admin', 'Secure123!', 'admin') ON CONFLICT DO NOTHING;
