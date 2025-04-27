"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Проверяем данные пользователя в localStorage
        const isAuthenticated =
          localStorage.getItem("is_authenticated") === "true";
        const userEmail = localStorage.getItem("user_email");
        const userId = localStorage.getItem("user_id");
        const userRoleId = localStorage.getItem("user_role_id");

        if (!isAuthenticated || !userEmail || !userId || !userRoleId) {
          // Если данные неполные, перенаправляем на страницу входа
          window.location.replace("/");
          return;
        }

        // Получаем текущую сессию
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // Если нет сессии, перенаправляем на страницу входа
          window.location.replace("/");
          return;
        }

        // Устанавливаем cookie для middleware
        document.cookie = `is_authenticated=true; path=/; max-age=${
          60 * 60 * 24 * 7
        }`; // 7 дней

        setIsLoading(false);
      } catch (error) {
        console.error("Ошибка при проверке авторизации:", error);
        window.location.replace("/");
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Проверка авторизации...</span>
      </div>
    );
  }

  return <>{children}</>;
}
