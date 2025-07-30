interface Session {
    userId: number;
    username: string;
    email: string;
    created: string; // unix timestamp
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

export type { Session };