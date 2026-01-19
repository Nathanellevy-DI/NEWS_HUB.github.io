// Security utilities for NewsHub
// Implements rate limiting, input validation, and sanitization

// ===================================
// RATE LIMITING
// ===================================

class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    // Check if request is allowed
    isAllowed(key = 'global') {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];

        // Remove old requests outside the time window
        const validRequests = userRequests.filter(timestamp =>
            now - timestamp < this.windowMs
        );

        // Check if limit exceeded
        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        // Add new request
        validRequests.push(now);
        this.requests.set(key, validRequests);

        return true;
    }

    // Get remaining requests
    getRemaining(key = 'global') {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        const validRequests = userRequests.filter(timestamp =>
            now - timestamp < this.windowMs
        );

        return Math.max(0, this.maxRequests - validRequests.length);
    }

    // Reset for a specific key
    reset(key = 'global') {
        this.requests.delete(key);
    }
}

// Create rate limiters for different endpoints
const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute for API calls
const searchRateLimiter = new RateLimiter(20, 60000); // 20 searches per minute

// ===================================
// INPUT VALIDATION & SANITIZATION
// ===================================

class InputValidator {
    // Sanitize HTML to prevent XSS
    static sanitizeHTML(input) {
        if (typeof input !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Validate and sanitize search query
    static validateSearchQuery(query) {
        if (typeof query !== 'string') {
            throw new Error('Search query must be a string');
        }

        // Length limits
        if (query.length === 0) {
            throw new Error('Search query cannot be empty');
        }

        if (query.length > 200) {
            throw new Error('Search query too long (max 200 characters)');
        }

        // Sanitize
        const sanitized = this.sanitizeHTML(query.trim());

        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /<iframe/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(sanitized)) {
                throw new Error('Invalid characters in search query');
            }
        }

        return sanitized;
    }

    // Validate category name
    static validateCategory(category) {
        const validCategories = [
            'general', 'technology', 'business', 'sports',
            'entertainment', 'science', 'health'
        ];

        if (!validCategories.includes(category)) {
            throw new Error('Invalid category');
        }

        return category;
    }

    // Validate custom category input
    static validateCustomCategory(name, keywords) {
        // Validate name
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('Category name is required');
        }

        if (name.length > 50) {
            throw new Error('Category name too long (max 50 characters)');
        }

        // Validate keywords
        if (typeof keywords !== 'string' || keywords.length === 0) {
            throw new Error('Keywords are required');
        }

        if (keywords.length > 200) {
            throw new Error('Keywords too long (max 200 characters)');
        }

        return {
            name: this.sanitizeHTML(name.trim()),
            keywords: this.sanitizeHTML(keywords.trim())
        };
    }

    // Validate URL
    static validateURL(url) {
        if (typeof url !== 'string') {
            throw new Error('URL must be a string');
        }

        try {
            const urlObj = new URL(url);

            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('Invalid URL protocol');
            }

            return url;
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    }

    // Validate color input
    static validateColor(color) {
        if (typeof color !== 'string') {
            throw new Error('Color must be a string');
        }

        // Check if valid hex color
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        if (!hexPattern.test(color)) {
            throw new Error('Invalid color format (must be hex)');
        }

        return color;
    }

    // Sanitize object for localStorage
    static sanitizeForStorage(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            // Only allow expected keys
            if (typeof key === 'string' && key.length < 100) {
                if (typeof value === 'string') {
                    sanitized[key] = this.sanitizeHTML(value);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                } else if (Array.isArray(value)) {
                    sanitized[key] = value.map(item =>
                        typeof item === 'string' ? this.sanitizeHTML(item) : item
                    );
                } else if (typeof value === 'object') {
                    sanitized[key] = this.sanitizeForStorage(value);
                }
            }
        }

        return sanitized;
    }
}

// ===================================
// SECURE API KEY HANDLING
// ===================================

class SecureAPIKeyManager {
    constructor() {
        // In production, this should come from environment variables
        // For now, we'll use a configuration approach
        this.apiKey = null;
        this.loadAPIKey();
    }

    // Load API key from secure source
    loadAPIKey() {
        // Priority order:
        // 1. Environment variable (if available via build process)
        // 2. Secure configuration file (not committed to git)
        // 3. User input (stored securely in localStorage with encryption)

        // Check if API key is in localStorage (encrypted)
        const storedKey = localStorage.getItem('newsapi_key_encrypted');
        if (storedKey) {
            try {
                this.apiKey = this.decryptKey(storedKey);
                return;
            } catch (error) {
                console.warn('Failed to decrypt stored API key');
            }
        }

        // Fallback to default (should be removed in production)
        // SECURITY WARNING: This should be moved to environment variables
        this.apiKey = '79377d568bcf41a09bd598b6fa41fcfb';
    }

    // Get API key (never expose directly)
    getKey() {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }
        return this.apiKey;
    }

    // Simple encryption for localStorage (basic obfuscation)
    // In production, use proper encryption library
    encryptKey(key) {
        return btoa(key.split('').reverse().join(''));
    }

    // Simple decryption
    decryptKey(encrypted) {
        return atob(encrypted).split('').reverse().join('');
    }

    // Set API key (for user configuration)
    setKey(key) {
        if (typeof key !== 'string' || key.length < 10) {
            throw new Error('Invalid API key format');
        }

        this.apiKey = key;
        const encrypted = this.encryptKey(key);
        localStorage.setItem('newsapi_key_encrypted', encrypted);
    }

    // Clear API key
    clearKey() {
        this.apiKey = null;
        localStorage.removeItem('newsapi_key_encrypted');
    }
}

// Initialize secure API key manager
const apiKeyManager = new SecureAPIKeyManager();

// ===================================
// EXPORT FOR USE IN OTHER MODULES
// ===================================

window.RateLimiter = RateLimiter;
window.InputValidator = InputValidator;
window.SecureAPIKeyManager = SecureAPIKeyManager;
window.apiRateLimiter = apiRateLimiter;
window.searchRateLimiter = searchRateLimiter;
window.apiKeyManager = apiKeyManager;

// ===================================
// SECURITY HEADERS & CSP
// ===================================

// Add security-related meta tags if not present
document.addEventListener('DOMContentLoaded', () => {
    // Add CSP meta tag for additional security
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://newsapi.org https://api.allorigins.win;";
        document.head.appendChild(cspMeta);
    }
});

console.log('Security utilities initialized');
