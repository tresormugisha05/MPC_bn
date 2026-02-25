export type InventoryLogReason = "reserved" | "expired" | "checkout" | "cancelled";

export interface InventoryLog {
    id: string;                        // UUID – primary key
    product_id: string;                // FK → Product.id
    /** Negative = deducted, Positive = restored */
    change: number;
    reason: InventoryLogReason;        // Why the stock changed
    reservation_id: string | null;     // FK → Reservation.id (nullable)
    stock_before: number;              // Stock level BEFORE this change
    stock_after: number;               // Stock level AFTER this change
    created_at: Date;                  // When the change occurred
}

/** Payload for writing a new audit entry */
export interface CreateInventoryLogInput {
    product_id: string;
    change: number;
    reason: InventoryLogReason;
    reservation_id?: string;
    stock_before: number;
    stock_after: number;
}
