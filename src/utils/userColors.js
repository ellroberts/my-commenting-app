// src/utils/userColors.js

// Figma-inspired color palette for user avatars
const USER_COLORS = [
  {
    name: 'red',
    background: '#FF6B6B',
    border: '#E55555',
    text: 'white'
  },
  {
    name: 'blue',
    background: '#4ECDC4',
    border: '#3DB5AD',
    text: 'white'
  },
  {
    name: 'purple',
    background: '#A34696',
    border: '#8B3A7A',
    text: 'white'
  },
  {
    name: 'orange',
    background: '#FF8E53',
    border: '#E6733D',
    text: 'white'
  },
  {
    name: 'green',
    background: '#6BCF7F',
    border: '#55B569',
    text: 'white'
  }
];

// Simple hash function to convert string to number
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get consistent color for a user based on their name
export function getUserColor(userName) {
  if (!userName) {
    return USER_COLORS[0]; // Default to red if no user name
  }
  
  const hash = hashString(userName.toLowerCase());
  const colorIndex = hash % USER_COLORS.length;
  return USER_COLORS[colorIndex];
}

// Get user initials for display (just first letter like Figma)
export function getUserInitials(userName) {
  if (!userName) return 'A';
  
  return userName[0].toUpperCase();
}