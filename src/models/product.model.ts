export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  owner_id: string;
  created_at: Date;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
}
