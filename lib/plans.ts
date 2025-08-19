export type PlanId = "test-3m" | "test-6m" | "live-1m" | "live-3m" | "live-6m";

export const PLANS: Record<PlanId, {
  id: PlanId;
  uiLabel: string;
  checkoutName: string;
  amountPence: number;
  durationDays: number;
  product: "test" | "live";
}> = {
  "test-3m": { id: "test-3m", uiLabel: "£150 / 3 months", checkoutName: "Practice Mode • 3 months", amountPence: 15000, durationDays: 90,  product: "test" },
  "test-6m": { id: "test-6m", uiLabel: "£250 / 6 months", checkoutName: "Practice Mode • 6 months", amountPence: 25000, durationDays: 180, product: "test" },
  "live-1m": { id: "live-1m", uiLabel: "£150 / 1 month",  checkoutName: "Live Mode • 1 month",      amountPence: 15000, durationDays: 30,  product: "live" },
  "live-3m": { id: "live-3m", uiLabel: "£300 / 3 months", checkoutName: "Live Mode • 3 months",     amountPence: 30000, durationDays: 90,  product: "live" },
  "live-6m": { id: "live-6m", uiLabel: "£500 / 6 months", checkoutName: "Live Mode • 6 months",     amountPence: 50000, durationDays: 180, product: "live" },
};

export const TEST_PLAN_IDS: PlanId[] = ["test-3m", "test-6m"];
export const LIVE_PLAN_IDS: PlanId[] = ["live-1m", "live-3m", "live-6m"];
