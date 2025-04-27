-- Функция для создания пользователя (обходит RLS)
CREATE OR REPLACE FUNCTION create_user(user_email TEXT, user_password_hash TEXT, user_role_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Выполняется с правами владельца функции (обходит RLS)
AS $$
BEGIN
  INSERT INTO users (email, password_hash, role_id, created_at)
  VALUES (user_email, user_password_hash, user_role_id, NOW());
END;
$$;

-- Функция для получения пользователя по email (обходит RLS)
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER -- Выполняется с правами владельца функции (обходит RLS)
AS $$
BEGIN
  RETURN QUERY SELECT * FROM users WHERE email = user_email;
END;
$$;

-- Функция для создания категорий по умолчанию (обходит RLS)
CREATE OR REPLACE FUNCTION create_default_categories(user_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Выполняется с правами владельца функции (обходит RLS)
AS $$
BEGIN
  -- Категории расходов
  INSERT INTO categories (user_id, name, type, created_at)
  VALUES
    (user_id, 'Продукты', 'expense', NOW()),
    (user_id, 'Кафе', 'expense', NOW()),
    (user_id, 'Жилье', 'expense', NOW()),
    (user_id, 'Транспорт', 'expense', NOW()),
    (user_id, 'Подарки', 'expense', NOW()),
    (user_id, 'Другое', 'expense', NOW());

  -- Категории доходов
  INSERT INTO categories (user_id, name, type, created_at)
  VALUES
    (user_id, 'Зарплата', 'income', NOW()),
    (user_id, 'Подработка', 'income', NOW()),
    (user_id, 'Подарки', 'income', NOW()),
    (user_id, 'Другое', 'income', NOW());
END;
$$;
