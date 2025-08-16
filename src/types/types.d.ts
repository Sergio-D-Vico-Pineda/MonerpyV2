interface Session {
    userId: number;
    username: string;
    email: string;
    created: string; // unix timestamp
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "warning" | "info" | string;
    duration?: number;
}

// Extend Astro's App.Locals to include user information
declare global {
    namespace App {
        interface Locals {
            user?: {
                id: number;
                username: string;
                email: string;
                created: string;
            };
        }
    }
}

export type { Session, Tag, Toast };