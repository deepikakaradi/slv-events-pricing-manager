/**
 * Global utility functions for formatting
 */

/**
 * Formats a number to Indian Rupee (INR) currency representation.
 * @param {number} amount - The numeric amount to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};
