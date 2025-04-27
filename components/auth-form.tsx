"use client";

import type React from "react";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import * as crypto from "crypto";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Хеширование пароля
  const hashPassword = (password: string): string => {
    return crypto.createHash("sha256").update(password).digest("hex");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // 1. Сначала проверяем пользователя в нашей таблице
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (userError) {
          throw new Error("Пользователь не найден");
        }

        // 2. Проверяем пароль
        const hashedPassword = hashPassword(password);
        if (userData.password_hash !== hashedPassword) {
          throw new Error("Неверный пароль");
        }

        // 3. Создаем сессию через Supabase Auth
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) {
          throw authError;
        }

        if (authData?.session) {
          // 4. Сохраняем данные в localStorage
          localStorage.setItem("user_email", email);
          localStorage.setItem("user_id", userData.id);
          localStorage.setItem("user_role_id", userData.role_id);
          localStorage.setItem("is_authenticated", "true");

          // 5. Устанавливаем cookie для middleware
          document.cookie = `is_authenticated=true; path=/; max-age=${
            60 * 60 * 24 * 7
          }`; // 7 дней

          // 6. Перенаправляем на dashboard
          window.location.replace("/dashboard");
        }
      } else {
        // Регистрация нового пользователя
        // 1. Проверяем существование пользователя
        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("id")
          .eq("email", email);

        if (existingUserError) {
          throw new Error("Ошибка при проверке существующего пользователя");
        }

        if (existingUser && existingUser.length > 0) {
          throw new Error("Пользователь с таким email уже существует");
        }

        // 2. Получаем роль "user"
        const { data: roles, error: rolesError } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "user");

        if (rolesError) {
          throw new Error("Ошибка при получении роли пользователя");
        }

        if (!roles || roles.length === 0) {
          throw new Error("Роль 'user' не найдена");
        }

        const roleId = roles[0].id;

        // 3. Создаем запись в таблице users
        const hashedPassword = hashPassword(password);
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              email,
              password_hash: hashedPassword,
              role_id: roleId,
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error("Ошибка при создании пользователя");
        }

        if (!newUser) {
          throw new Error("Не удалось создать пользователя");
        }

        // 4. Создаем категории по умолчанию
        // Категории расходов
        await supabase.from("categories").insert([
          { user_id: newUser.id, name: "Продукты", type: "expense" },
          { user_id: newUser.id, name: "Кафе", type: "expense" },
          { user_id: newUser.id, name: "Жилье", type: "expense" },
          { user_id: newUser.id, name: "Транспорт", type: "expense" },
          { user_id: newUser.id, name: "Подарки", type: "expense" },
          { user_id: newUser.id, name: "Другое", type: "expense" },
        ]);

        // Категории доходов
        await supabase.from("categories").insert([
          { user_id: newUser.id, name: "Зарплата", type: "income" },
          { user_id: newUser.id, name: "Подработка", type: "income" },
          { user_id: newUser.id, name: "Подарки", type: "income" },
          { user_id: newUser.id, name: "Другое", type: "income" },
        ]);

        alert("Регистрация успешна! Теперь вы можете войти.");
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Ошибка авторизации:", err);
      setError(err.message || "Произошла ошибка при авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="text-2xl font-bold text-center">
          МАГАtrackerz
        </CardTitle>
        <CardDescription className="text-white text-center">
          {isLogin ? "Войдите в свой аккаунт" : "Создайте новый аккаунт"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleAuth}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-green-600"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-green-600"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
          <Button
            type="submit"
            className="w-full mt-6 bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? "Вход..." : "Регистрация..."}
              </>
            ) : isLogin ? (
              "Войти"
            ) : (
              "Зарегистрироваться"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
          className="text-green-600"
        >
          {isLogin
            ? "Нет аккаунта? Зарегистрируйтесь"
            : "Уже есть аккаунт? Войдите"}
        </Button>
      </CardFooter>
    </Card>
  );
}
