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
    // 1. Проверяем пользователя в нашей таблице users
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email)

    if (userError) {
      console.error("Ошибка при поиске пользователя:", userError)
      return NextResponse.json({ error: "Ошибка при поиске пользователя" }, { status: 500 })
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // 2. Проверяем пароль
    const hashedPassword = hashPassword(password)
    const user = userData[0]

    if (user.password_hash !== hashedPassword) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 })
    }

    // 3. Создаем сессию через Supabase Auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("Ошибка при создании сессии:", signInError)
      return NextResponse.json({ error: "Ошибка при создании сессии" }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    console.error("Ошибка при входе:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
