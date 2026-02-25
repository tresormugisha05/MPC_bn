export interface Order {
    id: string;              // UUID – primary key
    user_id: string;         // FK → User.id
    reservation_id: string;  // FK → Reservation.id (UNIQUE – 1 order per reservation)
    product_id: string;      // FK → Product.id
    quantity: number;        // Units ordered
    total_price: number;     // quantity × product.price at time of order (DECIMAL 10,2)
    created_at: Date;        // Auto-set by Prisma
}

/** Payload for creating an order at checkout */
export interface CreateOrderInput {
    user_id: string;
    reservation_id: string;
    product_id: string;
    quantity: number;
    total_price: number;
}
