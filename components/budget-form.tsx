"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type Category, getCurrentUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function BudgetForm() {
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchCategories() {
      const user = await getCurrentUser()
      if (!user) return

      const { data } = await supabase.from("categories").select("*").eq("user_id", user.id).eq("type", "expense")

      if (data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const user = await getCurrentUser()
      if (!user) throw new Error("Пользователь не авторизован")

      // Проверка на заполнение обязательных полей
      if (!categoryId || !amount || !month) {
        throw new Error("Пожалуйста, заполните все обязательные поля")
      }

      // Форматируем дату как первый день месяца
      const formattedMonth = format(month, "yyyy-MM-01")

      // Проверяем, существует ли уже бюджет для этой категории на этот месяц
      const { data: existingBudget } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .eq("month", formattedMonth)
        .single()

      if (existingBudget) {
        // Обновляем существующий бюджет
        const { error: updateError } = await supabase
          .from("budgets")
          .update({ limit_amount: Number.parseFloat(amount) })
          .eq("id", existingBudget.id)

        if (updateError) throw updateError
      } else {
        // Добавляем новый бюджет
        const { error: insertError } = await supabase.from("budgets").insert([
          {
            user_id: user.id,
            category_id: Number.parseInt(categoryId),
            limit_amount: Number.parseFloat(amount),
            month: formattedMonth,
          },
        ])

        if (insertError) throw insertError
      }

      // Перенаправление на страницу бюджетов
      router.push("/budgets")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при добавлении бюджета")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="text-xl">Установить бюджет</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Категория расходов</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Лимит на месяц</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
                className="border-2 border-green-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Месяц</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-2 border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {month ? format(month, "LLLL yyyy", { locale: ru }) : "Выберите месяц"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={month}
                    onSelect={(date) => date && setMonth(startOfMonth(date))}
                    initialFocus
                    locale={ru}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <Button type="submit" className="w-full mt-6 bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
