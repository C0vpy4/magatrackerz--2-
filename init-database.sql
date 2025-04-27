-- Создание функции для проверки и создания таблицы ролей
CREATE OR REPLACE FUNCTION create_roles_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Проверяем существование таблицы ролей
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        -- Создаем таблицу ролей
        CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(20) UNIQUE NOT NULL
        );
        
        -- Вставляем роли по умолчанию
        INSERT INTO roles (id, name) VALUES 
            (1, 'user'), 
            (2, 'admin'), 
            (3, 'auditor');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки и создания таблицы пользователей
CREATE OR REPLACE FUNCTION create_users_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Проверяем существование таблицы пользователей
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        -- Создаем таблицу пользователей
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role_id INTEGER REFERENCES roles(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки и создания таблицы категорий
CREATE OR REPLACE FUNCTION create_categories_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Проверяем существование таблицы категорий
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'categories') THEN
        -- Создаем таблицу категорий
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки и создания таблицы транзакций
CREATE OR REPLACE FUNCTION create_transactions_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Проверяем существование таблицы транзакций
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions') THEN
        -- Создаем таблицу транзакций
        CREATE TABLE transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
            date DATE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для проверки и создания таблицы бюджетов
CREATE OR REPLACE FUNCTION create_budgets_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Проверяем существование таблицы бюджетов
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'budgets') THEN
        -- Создаем таблицу бюджетов
        CREATE TABLE budgets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            limit_amount DECIMAL(10, 2) NOT NULL,
            month DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Выполняем все функции для создания таблиц
SELECT create_roles_table_if_not_exists();
SELECT create_users_table_if_not_exists();
SELECT create_categories_table_if_not_exists();
SELECT create_transactions_table_if_not_exists();
SELECT create_budgets_table_if_not_exists();

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

-- Политики для категорий
DROP POLICY IF EXISTS "Пользователи могут видеть только свои категории" ON categories;
CREATE POLICY "Пользователи могут видеть только свои категории"
ON categories FOR SELECT
USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

DROP POLICY IF EXISTS "Пользователи могут создавать свои категории" ON categories;
CREATE POLICY "Пользователи могут создавать свои категории"
ON categories FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

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
