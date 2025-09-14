// Frontend date utilities with proper handling for stored dates

/**
 * Format a date for display - shows exactly what was stored without timezone shifts
 * @param {string|Date} dateValue - Date value to format (from backend)
 * @returns {string} - Formatted date in DD/MM/YYYY format
 */
export const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '-';
  
  try {
    const dateStr = dateValue.toString();
    
    // Handle ISO date strings (YYYY-MM-DDTHH:mm:ss.sssZ) - extract date part only
    if (dateStr.includes('T')) {
      const datePart = dateStr.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Handle YYYY-MM-DD format directly
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Fallback - parse without timezone to avoid shifts
    const date = new Date(dateValue + 'T12:00:00'); // Add noon time to avoid timezone issues
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
    
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return '-';
  }
};

/**
 * Format a timestamp with time (for createdAt, updatedAt) using Fortaleza timezone
 * @param {string|Date} dateValue - Date value to format
 * @returns {string} - Formatted datetime string
 */
export const formatDateTimeForDisplay = (dateValue) => {
  if (!dateValue) return '-';
  
  try {
    const date = new Date(dateValue);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Fortaleza',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting datetime:', dateValue, error);
    return '-';
  }
};