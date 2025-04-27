"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { LoadingError } from "@/components/ui/loading-error"

export default function BalanceCard() {
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalance() {
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

        // Получаем транзакции пользователя
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)

        if (transactionsError) {
          console.error("Ошибка загрузки транзакций:", transactionsError)
          setError("Не удалось загрузить данные транзакций")
          setLoading(false)
          return
        }

        if (transactions) {
          // Вычисляем общий доход
          const totalIncome = transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0)

          // Вычисляем общий расход
          const totalExpense = transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0)

          setIncome(totalIncome)
          setExpense(totalExpense)
          setBalance(totalIncome - totalExpense)
        }

        setLoading(false)
      } catch (err) {
        console.error("Ошибка в fetchBalance:", err)
        setError("Произошла ошибка при загрузке данных баланса")
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  // Форматирование числа в рубли
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="text-xl">Общий баланс</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <LoadingError loading={loading} error={error}>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-center">{formatCurrency(balance)}</div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-2">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Доходы</p>
                  <p className="font-semibold text-green-600">{formatCurrency(income)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-2">
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Расходы</p>
                  <p className="font-semibold text-red-600">{formatCurrency(expense)}</p>
                </div>
              </div>
            </div>
          </div>
        </LoadingError>
      </CardContent>
    </Card>
  )
}
