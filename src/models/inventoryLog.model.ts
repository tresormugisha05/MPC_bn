export interface InventoryLog {
  id: string;
  product_id: string;
  change: number;
  reason: "reserved" | "expired" | "checkout" | "cancelled";
  reservation_id: string | null;
  stock_before: number;
  stock_after: number;
  created_at: Date;
}
