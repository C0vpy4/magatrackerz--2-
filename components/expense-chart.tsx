"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { LoadingError } from "@/components/ui/loading-error"

export default function ExpenseChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChartData() {
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

        // Получаем транзакции пользователя с категориями
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("*, category:categories(*)")
          .eq("user_id", userId)
          .eq("type", "expense")

        if (transactionsError) {
          console.error("Ошибка загрузки данных для графика:", transactionsError)
          setError("Не удалось загрузить данные для графика")
          setLoading(false)
          return
        }

        if (transactions && transactions.length > 0) {
          // Группировка расходов по категориям
          const categoryMap = new Map()

          transactions.forEach((transaction) => {
            const categoryName = transaction.category?.name || "Без категории"
            const currentAmount = categoryMap.get(categoryName) || 0
            categoryMap.set(categoryName, currentAmount + Number(transaction.amount))
          })

          // Преобразование в формат для графика
          const chartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value,
          }))

          setChartData(chartData)
        } else {
          setChartData([])
        }

        setLoading(false)
      } catch (err) {
        console.error("Ошибка в fetchChartData:", err)
        setError("Произошла ошибка при загрузке данных")
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  // Цвета для графика в стиле Дагестана
  const COLORS = ["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#F44336"]

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
        <CardTitle className="text-xl">Структура расходов</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <LoadingError loading={loading} error={error}>
          {chartData.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Нет данных для отображения</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </LoadingError>
      </CardContent>
    </Card>
  )
}
