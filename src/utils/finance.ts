/**
 * finance.ts
 * 
 * Centralized financial calculations for JST Web.
 * This ensures consistency in tax rates and totals across the app.
 */

export const GST_RATE = 0.05; // 5% GST

/**
 * Calculates the GST amount for a given subtotal.
 */
export const calculateGST = (subtotal: number): number => {
    return subtotal * GST_RATE;
};

/**
 * Calculates the grand total (subtotal + GST).
 */
export const calculateTotalWithGST = (subtotal: number): number => {
    return subtotal + calculateGST(subtotal);
};

/**
 * Formats a number to currency format (INR).
 */
export const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
};
