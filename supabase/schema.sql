-- Shift Maker - Supabase PostgreSQL Schema

-- 従業員テーブル
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  employee_id CHAR(6)     NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  hourly_wage INT         NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- シフト希望テーブル
CREATE TABLE IF NOT EXISTS shift_requests (
  id           SERIAL PRIMARY KEY,
  user_id      INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_date  DATE         NOT NULL,
  is_available BOOLEAN      NOT NULL DEFAULT TRUE,
  start_time   TIME,
  end_time     TIME,
  UNIQUE (user_id, target_date)
);

-- ユーザー定義テンプレート
CREATE TABLE IF NOT EXISTS user_templates (
  id         SERIAL PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label_name VARCHAR(20) NOT NULL,
  start_time TIME        NOT NULL,
  end_time   TIME        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- お知らせテーブル
CREATE TABLE IF NOT EXISTS announcements (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(100) NOT NULL,
  content         TEXT         NOT NULL,
  target_audience VARCHAR(20)  NOT NULL DEFAULT 'all'
                    CHECK (target_audience IN ('all','fulltime','parttime')),
  priority        VARCHAR(20)  NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('normal','important','urgent')),
  category        VARCHAR(20)  NOT NULL DEFAULT 'other'
                    CHECK (category IN ('shift','work','event','other')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 店舗設定テーブル
CREATE TABLE IF NOT EXISTS store_settings (
  key   VARCHAR(50) PRIMARY KEY,
  value TEXT        NOT NULL
);
INSERT INTO store_settings (key, value)
  VALUES ('default_hourly_wage', '1000')
  ON CONFLICT (key) DO NOTHING;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shift_requests_user_date
  ON shift_requests(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_announcements_created
  ON announcements(created_at DESC);
