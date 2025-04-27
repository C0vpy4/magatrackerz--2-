import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import * as crypto from "crypto"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Хеширование пароля
  const hashPassword = (password: string): string => {
    return crypto.createHash("sha256").update(password).digest("hex")
  }

  // Создаем клиент Supabase
  const supabase = createRouteHandlerClient(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  )

  try {
    // 1. Проверяем, существует ли уже пользователь с таким email
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)

    if (existingUserError) {
      console.error("Ошибка при проверке существующего пользователя:", existingUserError)
      return NextResponse.json({ error: "Ошибка при проверке существующего пользователя" }, { status: 500 })
    }

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
    }

    // 2. Регистрируем пользователя в Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      console.error("Ошибка при регистрации в Auth:", signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // 3. Получаем роль "user"
    const { data: roles, error: rolesError } = await supabase.from("roles").select("id").eq("name", "user")

    if (rolesError) {
      console.error("Ошибка при получении роли:", rolesError)
      return NextResponse.json({ error: "Ошибка при получении роли пользователя" }, { status: 500 })
    }

    if (!roles || roles.length === 0) {
      console.error("Роль 'user' не найдена")
      return NextResponse.json({ error: "Роль 'user' не найдена" }, { status: 500 })
    }

    const roleId = roles[0].id

    // 4. Создаем запись в таблице users
    const hashedPassword = hashPassword(password)
    const { error: insertError } = await supabase.from("users").insert([
      {
        email,
        password_hash: hashedPassword,
        role_id: roleId,
      },
    ])

    if (insertError) {
      console.error("Ошибка при создании пользователя:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5. Получаем ID созданного пользователя
    const { data: newUser, error: newUserError } = await supabase.from("users").select("id").eq("email", email).single()

    if (newUserError) {
      console.error("Ошибка при получении ID нового пользователя:", newUserError)
      return NextResponse.json({ error: "Ошибка при получении ID нового пользователя" }, { status: 500 })
    }

    // 6. Создаем категории по умолчанию
    // Категории расходов
    const { error: expenseError } = await supabase.from("categories").insert([
      { user_id: newUser.id, name: "Продукты", type: "expense" },
      { user_id: newUser.id, name: "Кафе", type: "expense" },
      { user_id: newUser.id, name: "Жилье", type: "expense" },
      { user_id: newUser.id, name: "Транспорт", type: "expense" },
      { user_id: newUser.id, name: "Подарки", type: "expense" },
      { user_id: newUser.id, name: "Другое", type: "expense" },
    ])

    if (expenseError) {
      console.error("Ошибка при создании категорий расходов:", expenseError)
    }

    // Категории доходов
    const { error: incomeError } = await supabase.from("categories").insert([
      { user_id: newUser.id, name: "Зарплата", type: "income" },
      { user_id: newUser.id, name: "Подработка", type: "income" },
      { user_id: newUser.id, name: "Подарки", type: "income" },
      { user_id: newUser.id, name: "Другое", type: "income" },
    ])

    if (incomeError) {
      console.error("Ошибка при создании категорий доходов:", incomeError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Ошибка при регистрации:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
