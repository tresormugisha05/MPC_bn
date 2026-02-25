export interface Product {
    id: string;            // UUID – primary key
    name: string;          // Display name (max 150 chars)
    description: string | null;  // Optional description
    price: number;         // Price in dollars (DECIMAL 10,2)
    stock: number;         // Units available
    image_url: string | null;    // Optional product image URL
    is_active: boolean;    // false = not available for drops
    created_at: Date;      // Auto-set by Prisma on creation
    owner_id: string;      // User ID of the creator
}

/** Payload for creating a new product */
export interface CreateProductInput {
    name: string;
    description?: string;
    price: number;
    stock: number;
    image_url?: string;
    is_active?: boolean;
    owner_id?: string; // Set server-side from authenticated user
}

/** Payload for updating an existing product */
export interface UpdateProductInput {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    image_url?: string;
    is_active?: boolean;
}
