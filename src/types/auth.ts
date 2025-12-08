export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}
