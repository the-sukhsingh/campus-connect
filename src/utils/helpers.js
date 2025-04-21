// Helper functions for client-side and server-side code


// Format date string to a localized format
export function formatDate(dateString){
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date time string to a localized format with time
export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate a random ID string
export function generateRandomId(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}


// Capitalize first letter of each word in a string
export function capitalizeWords(str){
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}