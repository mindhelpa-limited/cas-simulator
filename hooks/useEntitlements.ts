"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export type EntitlementState = {
  loading: boolean;
  hasTest: boolean;
  hasLive: boolean;
  expires?: { test?: number; live?: number };
};

export default function useEntitlements(): EntitlementState {
  const [state, setState] = useState<EntitlementState>({
    loading: true,
    hasTest: false,
    hasLive: false,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, hasTest: false, hasLive: false });
        return;
      }
      try {
        const db = getFirestore();
        const [testSnap, liveSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid, "entitlements", "test")),
          getDoc(doc(db, "users", user.uid, "entitlements", "live")),
        ]);
        const now = Date.now();
        const testExp = testSnap.exists() ? Number((testSnap.data() as any).expiresAt) : 0;
        const liveExp = liveSnap.exists() ? Number((liveSnap.data() as any).expiresAt) : 0;

        setState({
          loading: false,
          hasTest: !!testExp && testExp > now,
          hasLive: !!liveExp && liveExp > now,
          expires: {
            test: testExp || undefined,
            live: liveExp || undefined,
          },
        });
      } catch {
        setState({ loading: false, hasTest: false, hasLive: false });
      }
    });
    return () => unsub();
  }, []);

  return state;
}
