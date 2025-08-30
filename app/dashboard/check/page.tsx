"use client";

// --- Imports ---
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebaseClient"; // Assuming you have a useAuth hook
import { doc, getDoc, collection, getDocs } from "firebase/firestore"; // Import Firebase Firestore
import { db } from "@/lib/firebaseClient"; // Import your Firebase client DB instance
import { format } from "date-fns";
import Link from "next/link";
import { BsCheckCircleFill } from "react-icons/bs"; // Assumes you have react-icons installed

// --- Type Definitions ---
export type Entitlement = {
  product: "test" | "live";
  expiresAt: number;
};

// --- Main Component ---
export default function CheckPage() {
  const user = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Effect to fetch entitlements ---
  useEffect(() => {
    const fetchEntitlements = async () => {
      if (!user) {
        setEntitlements([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const entitlementsCollection = collection(db, "users", user.uid, "entitlements");
        const querySnapshot = await getDocs(entitlementsCollection);
        
        const fetchedEntitlements: Entitlement[] = [];
        const now = Date.now();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Entitlement;
          // Check if the entitlement is still active
          if (data.expiresAt > now) {
            fetchedEntitlements.push(data);
          }
        });

        setEntitlements(fetchedEntitlements);
      } catch (e) {
        console.error("Error fetching entitlements:", e);
        setEntitlements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [user]);

  // --- Render Logic ---
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white text-center">
        <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-4">Checking your status...</h1>
          <p className="text-gray-400">Loading your entitlements...</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Active Subscriptions</h1>
        
        {entitlements.length === 0 ? (
          <div className="text-center text-gray-400">
            <p className="text-xl">You don't have any active subscriptions.</p>
            <p className="mt-2">
              <Link href="/pricing" className="text-blue-500 hover:underline">
                View pricing plans
              </Link> to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {entitlements.map(e => (
              <div key={e.product} className="bg-gray-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold capitalize flex items-center gap-2">
                    <BsCheckCircleFill className="text-green-500" />
                    {e.product} Mode
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Access valid until: {format(e.expiresAt, "MMMM d, yyyy")}
                  </p>
                </div>
                <Link 
                  href={`/dashboard/${e.product}-mode`} 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                >
                  Go to {e.product} Mode
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}