// app/checkout/success/page.tsx
import { Suspense } from "react";
import SuccessClient from "./success-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <Suspense fallback={<div className="text-white">Loading…</div>}>
        <SuccessClient />
      </Suspense>
    </main>
  );
}
