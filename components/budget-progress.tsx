"use client"

import { useState, useEffect } from "react"
import { supabase, type Budget, type Transaction, getCurrentUser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function BudgetProgress() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBudgets() {
      const user = await getCurrentUser()
      if (!user) return

      // Получаем текущий месяц в формате YYYY-MM-01
      const currentMonth = new Date()
      currentMonth.setDate(1)
      const monthString = currentMonth.toISOString().substring(0, 10)

      // Получаем бюджеты на текущий месяц
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .eq("month", monthString)

      if (budgetsData) {
        setBudgets(budgetsData)

        // Получаем расходы по категориям за текущий месяц
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

        const { data: transactionsData } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .gte("date", startOfMonth.toISOString().substring(0, 10))
          .lte("date", endOfMonth.toISOString().substring(0, 10))

        if (transactionsData) {
          // Группируем расходы по категориям
          const expensesByCategory: Record<number, number> = {}

          transactionsData.forEach((transaction: Transaction) => {
            const categoryId = transaction.category_id
            expensesByCategory[categoryId] = (expensesByCategory[categoryId] || 0) + Number(transaction.amount)
          })

          setExpenses(expensesByCategory)
        }
      }

      setLoading(false)
    }

    fetchBudgets()
  }, [])

  // Форматирование числа в рубли
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Расчет процента использования бюджета
  const calculatePercentage = (budget: Budget) => {
    const spent = expenses[budget.category_id] || 0
    const limit = Number(budget.limit_amount)
    return Math.min(Math.round((spent / limit) * 100), 100)
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Бюджеты на месяц</CardTitle>
        <Link href="/budgets/add">
          <Button variant="outline" size="sm" className="text-white border-white hover:bg-green-700">
            <PlusCircle className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center">Загрузка...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>У вас пока нет бюджетов</p>
            <Link href="/budgets/add">
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                <PlusCircle className="h-4 w-4 mr-1" />
                Установить бюджет
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = calculatePercentage(budget)
              const spent = expenses[budget.category_id] || 0

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{budget.category?.name}</span>
                    <span className={percentage >= 100 ? "text-red-600 font-bold" : "text-gray-600"}>
                      {formatCurrency(spent)} / {formatCurrency(Number(budget.limit_amount))}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorClassName={
                      percentage >= 100 ? "bg-red-600" : percentage >= 75 ? "bg-yellow-600" : "bg-green-600"
                    }
                  />
                  <div className="text-sm text-right">
                    {percentage}% {percentage >= 100 ? "(Превышение!)" : ""}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
