export interface CreateReservationInput {
  user_id: string;
  product_id: string;
  quantity: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  status: "pending" | "completed" | "expired" | "cancelled";
  expires_at: Date;
  created_at: Date;
}
