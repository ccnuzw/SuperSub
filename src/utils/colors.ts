// A centralized utility for handling tag colors to ensure consistency.

// 1. Pre-defined, curated colors for known protocols
export const protocolColorMap: Record<string, string> = {
    vmess: '#ff69b4', 
    vless: '#8a2be2', 
    trojan: '#dc143c', 
    ss: '#00bfff',
    hysteria2: '#20b2aa', 
    tuic: '#7b68ee', 
    'http': '#2ecc71', 
    'https': '#27ae60',
    'socks5': '#f1c40f', 
    'hysteria': '#1abc9c', 
    'ssr': '#e67e22',
};

// A list of appealing, high-contrast colors for dynamic tag generation.
const vibrantColors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#d35400',
    '#c0392b', '#16a085', '#27ae60', '#2980b9', '#8e44ad',
];

/**
 * Generates a consistent, pseudo-random color from a given string.
 * This ensures that the same string (e.g., a region name) always gets the same color.
 * @param str The input string.
 * @returns A hex color code.
 */
export const getColorFromString = (str: string): string => {
    if (!str) {
        return '#7f8c8d'; // Default color for empty strings
    }
    // Simple hash function to get a numeric value from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use the hash to pick a color from the vibrantColors array
    const index = Math.abs(hash % vibrantColors.length);
    return vibrantColors[index];
};

/**
 * Gets a color for a tag, prioritizing the curated protocol map
 * and falling back to the string-based generator for other tags.
 * @param key The key for the tag (e.g., 'vmess', 'US').
 * @param type The type of tag ('protocol' or 'region' or other).
 * @returns A hex color code.
 */
export const getTagColor = (key: string, type: 'protocol' | 'region' | string = 'protocol'): string => {
    if (!key) {
        return '#7f8c8d'; // Default color for empty/undefined strings
    }
    const lowerKey = key.toLowerCase();
    if (type === 'protocol' && protocolColorMap[lowerKey]) {
        return protocolColorMap[lowerKey];
    }
    return getColorFromString(key);
};

/**
 * Returns the style object for a Naive UI tag.
 * @param key The key for the tag.
 * @param type The type of tag.
 * @returns A style object for NTag's `color` prop.
 */
export const getNaiveTagColor = (key: string, type: 'protocol' | 'region' | string = 'protocol') => {
    return {
        color: getTagColor(key, type),
        textColor: '#ffffff',
        borderColor: 'transparent'
    };
};