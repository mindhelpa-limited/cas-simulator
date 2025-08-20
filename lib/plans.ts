// lib/plans.ts

export type PlanProduct = "test" | "live";

export type PlanId =
  | "test_3m"
  | "test_6m"
  | "live_1m"
  | "live_3m"
  | "live_6m";

export type Plan = {
  id: PlanId;
  product: PlanProduct;
  /** Access length in days */
  durationDays: number;
  /** Amount in minor units (GBP pence) */
  amount: number;
  currency: "gbp";
  /** Label shown on the pricing buttons */
  uiLabel: string;
};

export const PLANS: Record<PlanId, Plan> = {
  test_3m: {
    id: "test_3m",
    product: "test",
    durationDays: 90,
    amount: 15000, // £150.00
    currency: "gbp",
    uiLabel: "£150 / 3 months",
  },
  test_6m: {
    id: "test_6m",
    product: "test",
    durationDays: 180,
    amount: 25000, // £250.00
    currency: "gbp",
    uiLabel: "£250 / 6 months",
  },
  live_1m: {
    id: "live_1m",
    product: "live",
    durationDays: 30,
    amount: 15000, // £150.00
    currency: "gbp",
    uiLabel: "£150 / 1 month",
  },
  live_3m: {
    id: "live_3m",
    product: "live",
    durationDays: 90,
    amount: 30000, // £300.00
    currency: "gbp",
    uiLabel: "£300 / 3 months",
  },
  live_6m: {
    id: "live_6m",
    product: "live",
    durationDays: 180,
    amount: 50000, // £500.00
    currency: "gbp",
    uiLabel: "£500 / 6 months",
  },
} as const;

export const TEST_PLAN_IDS: PlanId[] = ["test_3m", "test_6m"];
export const LIVE_PLAN_IDS: PlanId[] = ["live_1m", "live_3m", "live_6m"];
export const ALL_PLAN_IDS: PlanId[] = [...TEST_PLAN_IDS, ...LIVE_PLAN_IDS];

export function isPlanId(value: string): value is PlanId {
  return (ALL_PLAN_IDS as readonly string[]).includes(value);
}
