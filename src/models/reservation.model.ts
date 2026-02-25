export type ReservationStatus = "pending" | "completed" | "expired" | "cancelled";

export interface Reservation {
    id: string;            // UUID – returned to frontend after creation
    user_id: string;       // FK → User.id
    product_id: string;    // FK → Product.id
    quantity: number;      // Units reserved
    status: ReservationStatus;
    expires_at: Date;      // created_at + 5 minutes
    created_at: Date;      // Auto-set by Prisma
}

export interface CreateReservationInput {
    user_id: string;
    product_id: string;
    quantity: number;
}
export interface ReservationResponse {
    id: string;
    product_id: string;
    quantity: number;
    status: ReservationStatus;
    expires_at: Date;
    created_at: Date;
}
