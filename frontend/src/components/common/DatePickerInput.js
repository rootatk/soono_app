import React from 'react';
import { Form } from 'react-bootstrap';

const DatePickerInput = ({ value, onChange, placeholder = "DD-MM-AAAA" }) => {
  // Convert backend YYYY-MM-DD format to YYYY-MM-DD for HTML5 date input
  const convertToInputFormat = (backendDate) => {
    if (!backendDate) return '';
    
    // If it's already in YYYY-MM-DD format, use it directly
    if (backendDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return backendDate;
    }
    
    // If it's in DD-MM-YYYY format, convert it
    if (backendDate.length === 10 && backendDate.includes('-')) {
      const [day, month, year] = backendDate.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

  const handleDateChange = (e) => {
    const inputValue = e.target.value; // YYYY-MM-DD format from date input
    // Send YYYY-MM-DD directly to parent (backend format)
    onChange(inputValue);
  };

  return (
    <Form.Control
      type="date"
      value={convertToInputFormat(value)}
      onChange={handleDateChange}
      placeholder={placeholder}
      style={{ maxWidth: '200px' }}
    />
  );
};

export default DatePickerInput;