-- Создание таблицы ролей (если еще не создана)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL -- 'user', 'admin', 'auditor'
);

-- Вставка ролей по умолчанию
INSERT INTO roles (name) VALUES ('user'), ('admin'), ('auditor')
ON CONFLICT (name) DO NOTHING;

-- Настройка политик безопасности на уровне строк (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
DROP POLICY IF EXISTS "Пользователи могут видеть только свои данные" ON users;
CREATE POLICY "Пользователи могут видеть только свои данные"
ON users FOR SELECT
USING (auth.uid()::text = email);

-- Политика для вставки пользователей (разрешаем всем)
DROP POLICY IF EXISTS "Разрешить вставку пользователей" ON users;
CREATE POLICY "Разрешить вставку пользователей"
ON users FOR INSERT
WITH CHECK (true);

-- Политики для категорий
DROP POLICY IF EXISTS "Пользователи могут видеть только свои категории" ON categories;
CREATE POLICY "Пользователи могут видеть только свои категории"
ON categories FOR SELECT
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут создавать свои категории" ON categories;
CREATE POLICY "Пользователи могут создавать свои категории"
ON categories FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Пользователи могут обновлять свои категории" ON categories;
CREATE POLICY "Пользователи могут обновлять свои категории"
ON categories FOR UPDATE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут удалять свои категории" ON categories;
CREATE POLICY "Пользователи могут удалять свои категории"
ON categories FOR DELETE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

-- Политики для транзакций
DROP POLICY IF EXISTS "Пользователи могут видеть только свои транзакции" ON transactions;
CREATE POLICY "Пользователи могут видеть только свои транзакции"
ON transactions FOR SELECT
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут создавать свои транзакции" ON transactions;
CREATE POLICY "Пользователи могут создавать свои транзакции"
ON transactions FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут обновлять свои транзакции" ON transactions;
CREATE POLICY "Пользователи могут обновлять свои транзакции"
ON transactions FOR UPDATE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут удалять свои транзакции" ON transactions;
CREATE POLICY "Пользователи могут удалять свои транзакции"
ON transactions FOR DELETE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

-- Политики для бюджетов
DROP POLICY IF EXISTS "Пользователи могут видеть только свои бюджеты" ON budgets;
CREATE POLICY "Пользователи могут видеть только свои бюджеты"
ON budgets FOR SELECT
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут создавать свои бюджеты" ON budgets;
CREATE POLICY "Пользователи могут создавать свои бюджеты"
ON budgets FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут обновлять свои бюджеты" ON budgets;
CREATE POLICY "Пользователи могут обновлять свои бюджеты"
ON budgets FOR UPDATE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут удалять свои бюджеты" ON budgets;
CREATE POLICY "Пользователи могут удалять свои бюджеты"
ON budgets FOR DELETE
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
