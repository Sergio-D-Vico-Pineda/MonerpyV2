/**
 * Client-side user data management
 * Handles user profile UI updates
 */

interface ClientUser {
    id: number;
    username: string;
    email: string;
    created: string;
}

class UserManager {
    /**
     * Update user profile in UI elements
     */
    static updateUserInUI(user: ClientUser): void {
        // Update username displays
        const usernameElements = document.querySelectorAll('[data-user-username]');
        usernameElements.forEach(element => {
            if (element instanceof HTMLElement) {
                element.textContent = user.username;
            }
        });

        // Update email displays
        const emailElements = document.querySelectorAll('[data-user-email]');
        emailElements.forEach(element => {
            if (element instanceof HTMLElement) {
                element.textContent = user.email;
            }
        });

        // Update form inputs if they exist
        const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        
        if (usernameInput) usernameInput.value = user.username;
        if (emailInput) emailInput.value = user.email;

        console.log('User profile updated in UI');
    }

    /**
     * Handle profile update response
     */
    static handleProfileUpdate(user: ClientUser): void {
        // Update UI
        this.updateUserInUI(user);
        
        // Dispatch custom event for other components to listen to
        const event = new CustomEvent('userProfileUpdated', {
            detail: { user }
        });
        window.dispatchEvent(event);
    }
}

export { UserManager };
export type { ClientUser };
