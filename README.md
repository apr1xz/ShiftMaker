# Shift Maker — Next.js + TypeScript + Supabase

PHP版からの移植プロジェクト。

## セットアップ

### 1. Supabase プロジェクト作成

[supabase.com](https://supabase.com) でプロジェクトを作成し、`supabase/schema.sql` を SQL Editor で実行。

管理者アカウントは以下のスクリプトで作成（Node.js で実行）:

```js
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient('YOUR_URL', 'YOUR_SERVICE_ROLE_KEY', { auth: { persistSession: false } })

async function main() {
  const hash = await bcrypt.hash('YOUR_ADMIN_PASSWORD', 10)
  await supabase.from('admins').insert({ username: 'admin', password: hash })
  console.log('Done')
}
main()
```

### 2. 環境変数の設定

`.env.local` を編集:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUTH_SECRET=32文字以上のランダム文字列
```

`AUTH_SECRET` は `openssl rand -base64 32` で生成。

### 3. 起動

```bash
npm install
npm run dev
```

## 画面構成

| URL | 説明 |
|-----|------|
| `/` | ログイン / 新規登録 |
| `/home` | ホーム（お知らせ・メニュー） |
| `/shift/input` | シフト入力（カレンダー） |
| `/shift/view` | シフト確認・給与確認 |
| `/admin` | 管理者：シフト一覧・編集 |

## API

| メソッド | URL | 説明 |
|----------|-----|------|
| GET/POST | `/api/shifts` | シフト取得・保存 |
| POST | `/api/shifts/admin` | 管理者によるシフト更新 |
| POST/DELETE | `/api/templates` | テンプレート保存・削除 |
| GET/POST | `/api/announcements` | お知らせ一覧・作成 |
| POST | `/api/wages` | 時給更新 |
| GET | `/api/export` | CSV出力 |
| POST | `/api/register` | 従業員登録 |

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **認証**: NextAuth.js v5 (Credentials)
- **DB**: Supabase (PostgreSQL)
- **パスワード**: bcryptjs
- **スタイル**: CSS Custom Properties (オリジナルデザインを移植)
