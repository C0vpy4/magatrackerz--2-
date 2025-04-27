import { createClient } from "@supabase/supabase-js"

// Проверяем наличие переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Отсутствуют переменные окружения NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Создаем клиент Supabase с использованием переменных окружения
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

// Типы данных для работы с базой
export type User = {
  id: number
  email: string
  password_hash: string
  role_id: number
  created_at: string
}

export type Role = {
  id: number
  name: string
}

export type Category = {
  id: number
  user_id: number
  name: string
  type: "income" | "expense"
}

export type Transaction = {
  id: number
  user_id: number
  category_id: number
  amount: number
  type: "income" | "expense"
  date: string
  description: string
  created_at: string
  category?: Category
}

export type Budget = {
  id: number
  user_id: number
  category_id: number
  limit_amount: number
  month: string
  category?: Category
}

// Функция для получения текущего пользователя
export async function getCurrentUser() {
  try {
    // Получаем email из localStorage
    const email = localStorage.getItem("user_email")

    if (!email) {
      console.log("Email не найден в localStorage")
      return null
    }

    // Получаем данные пользователя из таблицы users
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error("Ошибка при получении данных пользователя:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("Ошибка в getCurrentUser:", err)
    return null
  }
}

// Функция для получения роли пользователя
export async function getUserRole(userId: number) {
  try {
    const { data, error } = await supabase.from("users").select("role_id, roles(name)").eq("id", userId).single()

    if (error) {
      console.error("Ошибка получения роли пользователя:", error)
      return null
    }

    return data?.roles?.name
  } catch (err) {
    console.error("Ошибка в getUserRole:", err)
    return null
  }
}
