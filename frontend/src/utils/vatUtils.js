/**
 * VAT Utility Functions
 * ---------------------
 * Philippine VAT rate is 12%. All product prices in the store
 * are VAT-inclusive, meaning the displayed price already contains VAT.
 *
 * These helpers extract the VAT component for display purposes.
 */

export const VAT_RATE = 0.12

/**
 * Calculate VAT breakdown from a VAT-inclusive amount.
 *
 * @param {number} totalAmount - The total amount (VAT-inclusive)
 * @returns {{ subtotalBeforeVat: number, vatAmount: number, total: number }}
 */
export function getVatBreakdown(totalAmount) {
    const amount = Number(totalAmount) || 0
    const subtotalBeforeVat = amount / (1 + VAT_RATE)
    const vatAmount = amount - subtotalBeforeVat

    return {
        subtotalBeforeVat: Math.round(subtotalBeforeVat * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(amount * 100) / 100,
    }
}
