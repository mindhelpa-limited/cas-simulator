"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";

type Entitlements =
  | { testMode?: { expiresAt: number; source?: string }; liveMode?: { expiresAt: number; source?: string } }
  | undefined;

export function useEntitlements() {
  const [uid, setUid] = useState<string | null>(null);
  const [ent, setEnt] = useState<Entitlements>(undefined);
  const [loading, setLoading] = useState(true);

  // Watch auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  // Watch user's document
  useEffect(() => {
    if (!uid) { setEnt(undefined); setLoading(false); return; }
    setLoading(true);
    const ref = doc(db, "users", uid);
    const off = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as any;
        setEnt(data?.entitlements);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => off();
  }, [uid]);

  const now = Date.now();
  const hasTest = !!ent?.testMode?.expiresAt && ent!.testMode!.expiresAt > now;
  const hasLive = !!ent?.liveMode?.expiresAt && ent!.liveMode!.expiresAt > now;

  return { loading, uid, entitlements: ent, hasTest, hasLive };
}
