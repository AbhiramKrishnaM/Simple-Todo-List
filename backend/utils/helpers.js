/**
 * Helper function to generate unique ID
 * @returns {string} Unique identifier combining timestamp and random string
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};
