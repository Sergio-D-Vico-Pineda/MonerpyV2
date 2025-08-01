// Redirect utilities with toast support
import { navigate } from 'astro:transitions/client';
import { ToastService } from './toast';

export function redirectWithToast(
    url: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | string = 'success',
    duration?: number
) {
    ToastService.addToast({ message, type, duration });
    if (typeof window !== 'undefined') {
        navigate(url, {
            history: "replace",
        });
    }
    return new Response(null, {
        status: 302,
        headers: { Location: url }
    });
}

// Server-side redirect helper for Astro
export function createRedirectWithToast(
    url: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | string = 'success',
    duration?: number
) {
    // Create a redirect response with a script that adds the toast
    const script = `
        <script>
            sessionStorage.setItem('toasts', JSON.stringify([{
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                message: ${JSON.stringify(message)},
                type: ${JSON.stringify(type)},
                duration: ${duration || 10000}
            }]));
            window.location.href = ${JSON.stringify(url)};
        </script>
    `;

    return new Response(script, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    });
}
