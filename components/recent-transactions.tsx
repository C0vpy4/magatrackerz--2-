"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Coffee, Home, Car, Gift, DollarSign, Briefcase } from "lucide-react"
import { LoadingError } from "@/components/ui/loading-error"

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true)
        setError(null)

        // Получаем ID пользователя из localStorage
        const userId = localStorage.getItem("user_id")

        if (!userId) {
          console.error("ID пользователя не найден в localStorage")
          setError("Не удалось загрузить данные пользователя")
          setLoading(false)
          return
        }

        // Получаем последние транзакции пользователя с категориями
        const { data, error: transactionsError } = await supabase
          .from("transactions")
          .select("*, category:categories(*)")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(5)

        if (transactionsError) {
          console.error("Ошибка загрузки транзакций:", transactionsError)
          setError("Не удалось загрузить данные транзакций")
          setLoading(false)
          return
        }

        if (data) {
          setTransactions(data)
        } else {
          setTransactions([])
        }

        setLoading(false)
      } catch (err) {
        console.error("Ошибка в fetchTransactions:", err)
        setError("Произошла ошибка при загрузке данных")
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Форматирование числа в рубли
  const formatCurrency = (amount: number, type: string) => {
    const prefix = type === "expense" ? "-" : "+"
    return (
      prefix +
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
      })
        .format(Math.abs(amount))
        .replace("₽", "₽")
    )
  }

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Получение иконки для категории
  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, any> = {
      Продукты: ShoppingBag,
      Кафе: Coffee,
      Жилье: Home,
      Транспорт: Car,
      Подарки: Gift,
      Зарплата: Briefcase,
      Другое: DollarSign,
    }

    const Icon = icons[categoryName] || DollarSign
    return <Icon className="h-5 w-5" />
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="text-xl">Последние транзакции</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <LoadingError loading={loading} error={error}>
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Нет транзакций</div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        transaction.type === "expense" ? "bg-red-100" : "bg-green-100"
                      }`}
                    >
                      {getCategoryIcon(transaction.category?.name || "Другое")}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category?.name || "Без категории"}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${transaction.type === "expense" ? "text-red-600" : "text-green-600"}`}
                  >
                    {formatCurrency(transaction.amount, transaction.type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LoadingError>
      </CardContent>
    </Card>
  )
}
