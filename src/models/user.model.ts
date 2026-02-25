export interface User {
    id: string;            // UUID – primary key
    email: string;         // Unique login identifier (max 150 chars)
    password: string;      // bcrypt hashed password
    name: string;          // Display name (max 100 chars)
    created_at: Date;      // Auto-set by Prisma on creation
}
export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginUserInput {
    email: string;
    password: string;
}

export type PublicUser = Omit<User, "password">;
