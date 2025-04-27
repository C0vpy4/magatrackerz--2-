import BalanceCard from "@/components/balance-card"
import ExpenseChart from "@/components/expense-chart"
import RecentTransactions from "@/components/recent-transactions"

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BalanceCard />
      <ExpenseChart />
      <RecentTransactions />
    </div>
  )
}
