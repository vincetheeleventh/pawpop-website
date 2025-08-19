// src/app/order/page.tsx
import { OrderForm } from "@/components/order/OrderForm";

export default function OrderPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Create Your Custom Portrait</h1>
      <OrderForm />
    </div>
  );
}
