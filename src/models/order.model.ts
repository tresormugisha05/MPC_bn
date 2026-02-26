export interface CreateOrderInput {
  user_id: string;
  reservation_id: string;
}

export interface Order {
  id: string;
  user_id: string;
  reservation_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  created_at: Date;
}
