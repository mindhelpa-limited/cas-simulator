"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      setErr(null);
      setResetMsg(null);

      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (e: any) {
      // Handle specific errors with friendly messages
      if (
        e.code === "auth/invalid-credential" ||
        e.code === "auth/wrong-password"
      ) {
        setErr("Hello, that was a wrong password. You can try again or reset it.");
      } else if (e.code === "auth/user-not-found") {
        setErr("No account found for this email. Please check or sign up.");
      } else if (e.code === "auth/too-many-requests") {
        setErr("Too many attempts. Please wait or reset your password.");
      } else {
        setErr("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErr("Please enter your email first.");
      return;
    }

    try {
      setErr(null);
      setResetMsg(null);
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Reset link sent to your email. Check your inbox or spam.");
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        setErr("No user found with that email.");
      } else {
        setErr("Something went wrong while sending reset email.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-md">
        <h1 className="text-2xl font-bold text-[#7B2CBF]">Welcome Back</h1>
        <p className="text-sm text-gray-600 mb-4">Sign in to your dashboard</p>

        <input
          className="mt-2 w-full p-3 bg-gray-100 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2CBF]"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mt-3">
          <input
            className="w-full p-3 pr-10 bg-gray-100 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2CBF]"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="text-right mt-2">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-[#3A86FF] hover:underline focus:outline-none"
          >
            Forgot password?
          </button>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="mt-5 w-full py-3 rounded bg-[#3A86FF] hover:bg-[#2e6fde] text-white text-sm font-medium transition"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
        {resetMsg && <p className="mt-3 text-sm text-green-600">{resetMsg}</p>}
      </div>
    </main>
  );
}
