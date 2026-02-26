/**
 * Product Type Definitions
 * TypeScript interfaces for Product-related operations
 */

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  is_active?: boolean;
  owner_id: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  is_active?: boolean;
}
