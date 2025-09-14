/**
 * Date utilities for Sóonó application
 * Handles proper timezone conversion for Fortaleza-CE, Brazil
 */

const TIMEZONE = 'America/Fortaleza';

/**
 * Create a date from YYYY-MM-DD string in Fortaleza timezone
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} - Date object in Fortaleza timezone
 */
const createDateInFortaleza = (dateString) => {
  if (!dateString) return new Date();
  
  // Validate format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error('Data deve estar no formato YYYY-MM-DD');
  }
  
  // Create date at noon in Fortaleza timezone to avoid edge cases
  return new Date(dateString + 'T12:00:00-03:00');
};

/**
 * Format date for display in Brazilian format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDateForBrazil = (date) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date for backend storage (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} - Date in YYYY-MM-DD format
 */
const formatDateForStorage = (date) => {
  if (!date) return null;
  
  return date.toLocaleDateString('en-CA', {
    timeZone: TIMEZONE
  }); // en-CA format is YYYY-MM-DD
};

/**
 * Get current date in Fortaleza timezone
 * @returns {Date} - Current date
 */
const getCurrentDateInFortaleza = () => {
  return new Date();
};

/**
 * Extract year and month from date for statistics (without timezone conversion to avoid shifts)
 * @param {Date|string} date - Date to process
 * @returns {string} - YYYY-MM format
 */
const getYearMonth = (date) => {
  if (!date) return '';
  
  const dateStr = date.toString();
  
  // Handle ISO date strings (YYYY-MM-DDTHH:mm:ss.sssZ) - extract date part only
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0]; // Get YYYY-MM-DD part
    const [year, month] = datePart.split('-');
    return `${year}-${month}`;
  }
  
  // Handle YYYY-MM-DD format directly
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  }
  
  // Fallback - parse without timezone conversion to avoid date shifts
  const dateObj = new Date(dateStr + 'T12:00:00'); // Add noon time to avoid timezone issues
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

module.exports = {
  TIMEZONE,
  createDateInFortaleza,
  formatDateForBrazil,
  formatDateForStorage,
  getCurrentDateInFortaleza,
  getYearMonth
};