// Helper functions for exporting data to CSV and PDF

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} headers - Array of header objects with label and key properties
 * @returns {string} - CSV string
 */
export function convertToCSV(data, headers) {
  if (!data || !data.length) return '';
  
  // Create the header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Handle cases where the value might contain commas or quotes
      const value = item[header.key] != null ? String(item[header.key]) : '';
      return `"${value.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  // Combine all rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Download data as CSV file
 * @param {string} csvContent - CSV content as string
 * @param {string} filename - Name for the downloaded file
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.display = 'none';
  
  // Add to DOM, trigger download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create an invisible iframe to load and print PDF data
 * @param {string} url - URL to the PDF data endpoint
 * @param {object} params - Query parameters for the request
 */
export function printPDF(url, params) {
  // Create query string
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = `${url}?${queryString}`;
  
  // Create an iframe with proper attributes for printing
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  printFrame.src = fullUrl;
  
  printFrame.onload = function() {
    try {
      printFrame.contentWindow.print();
    } catch (e) {
      console.error("Printing failed:", e);
    }
    
    // Remove the iframe after printing
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };
  
  document.body.appendChild(printFrame);
}

/**
 * Download data as PDF file
 * @param {string} url - URL to the PDF data endpoint
 * @param {object} params - Query parameters for the request
 * @param {string} filename - Name for the downloaded file
 */
export async function downloadPDF(url, params, filename) {
  try {
    // Create query string
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const fullUrl = `${url}?${queryString}`;
    
    // Fetch the PDF as blob
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error('PDF generation failed');
    }
    
    const blob = await response.blob();
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.pdf`);
    link.style.display = 'none';
    
    // Add to DOM, trigger download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error("Download failed:", error);
    alert("Download failed. Please try again later.");
  }
}