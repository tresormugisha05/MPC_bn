export type Role = "admin" | "customer";

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    created_at: Date;
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
