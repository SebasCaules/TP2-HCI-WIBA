
/**
 * Checks if JavaScript is enabled in the browser
 * @returns {boolean} True if JavaScript is enabled, false otherwise
 */
export function isJavaScriptEnabled(): boolean {
    try {
        // Try to use a JavaScript feature that would fail if JS is disabled
        const test = new Function('return true');
        return test() === true;
    } catch (e) {
        return false;
    }
}

/**
 * Checks if localStorage is available and working
 * @returns {boolean} True if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Checks if the browser supports modern web features
 * @returns {boolean} True if the browser supports modern web features
 */
export function hasModernBrowserSupport(): boolean {
    return (
        typeof window !== 'undefined' &&
        'localStorage' in window &&
        'fetch' in window &&
        'Promise' in window
    );
} 