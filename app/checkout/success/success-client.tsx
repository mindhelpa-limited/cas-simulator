// app/checkout/success/success-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleContinue = () => {
    // Redirect to the dashboard
    window.location.href = "/dashboard";
  };

  if (loading) return <main className="p-8 text-white">Verifying payment…</main>;

  return (
    <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-100 text-center">
      <h1 className="text-2xl font-bold">Payment successful ✅</h1>
      <p className="mt-4 text-gray-300">Your access to the product is now being configured. This may take a moment.</p>
      
      {isLoggedIn ? (
        <>
          <p className="mt-4 text-gray-300">You are already logged in. Click the button to continue to your dashboard.</p>
          <button
            onClick={handleContinue}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Go to Dashboard
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-gray-300">Please log in or create an account to access your new subscription.</p>
          <button
            onClick={handleContinue}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Log In / Sign Up
          </button>
        </>
      )}
    </div>
  );
}