import { describe, it, expect } from 'vitest';
import { calculateGST, calculateTotalWithGST, formatCurrency, GST_RATE } from './finance';

describe('Finance Utility Calculations', () => {

    it('should have the correct GST rate (5%)', () => {
        expect(GST_RATE).toBe(0.05);
    });

    it('should calculate 5% GST correctly for simple amounts', () => {
        expect(calculateGST(100)).toBe(5);
        expect(calculateGST(1000)).toBe(50);
        expect(calculateGST(500)).toBe(25);
    });

    it('should calculate total with 5% GST correctly', () => {
        expect(calculateTotalWithGST(100)).toBe(105);
        expect(calculateTotalWithGST(1000)).toBe(1050);
        expect(calculateTotalWithGST(500)).toBe(525);
    });

    it('should handle decimal amounts correctly', () => {
        const subtotal = 150.50;
        const expectedGst = subtotal * 0.05; // 7.525
        expect(calculateGST(subtotal)).toBe(expectedGst);
        expect(calculateTotalWithGST(subtotal)).toBe(subtotal + expectedGst);
    });

    it('should format currency correctly according to Indian standards', () => {
        expect(formatCurrency(1000)).toBe("1,000");
        expect(formatCurrency(100000)).toBe("1,00,000"); // Indian numbering system
        expect(formatCurrency(1234567.89)).toBe("12,34,567.89");
    });

});
