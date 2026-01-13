/**
 * ErrorTranslator.ts
 * 
 * This utility converts technical/backend error messages into 
 * user-friendly feedback.
 */

export const translateError = (error: any): { title: string; description: string } => {
    const message = typeof error === 'string' ? error : error?.message || '';
    const lowerMessage = message.toLowerCase();

    // Network / Fetch Errors
    if (lowerMessage.includes('fetch') || lowerMessage.includes('network error')) {
        return {
            title: "Connection Issue",
            description: "We're having trouble reaching our servers. Please check your internet connection and try again."
        };
    }

    // Supabase / Auth Errors
    if (lowerMessage.includes('invalid login credentials')) {
        return {
            title: "Login Failed",
            description: "The phone number or email you entered doesn't match our records."
        };
    }

    if (lowerMessage.includes('jwt expired') || lowerMessage.includes('invalid token')) {
        return {
            title: "Session Expired",
            description: "Your session has timed out. Please log in again to continue."
        };
    }

    // Database / Permission Errors
    if (lowerMessage.includes('row-level security') || lowerMessage.includes('permission denied')) {
        return {
            title: "Access Denied",
            description: "You don't have permission to perform this action. Contact your admin if you believe this is an error."
        };
    }

    // Fallback for unknown errors
    return {
        title: "Something Went Wrong",
        description: message || "An unexpected error occurred. Our team has been notified."
    };
};
