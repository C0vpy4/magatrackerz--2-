import EditTransactionForm from "@/components/edit-transaction-form"

export default function EditTransaction({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto">
      <EditTransactionForm transactionId={Number.parseInt(params.id)} />
    </div>
  )
}
