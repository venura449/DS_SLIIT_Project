// Authentication utility functions
// Use these helper functions in your components for consistent auth handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const minLength = 8;
/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data and token (role determined by backend)
 */
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    // Normalize backend response to { token, role, user }
    return {
        token: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        role: data.data.user.userType,
        user: data.data.user,
    };
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Registration response
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
};

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Auth data from login/register
 */
export const storeAuthData = (authData) => {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('role', authData.role);
    localStorage.setItem('user', JSON.stringify(authData.user || {}));
};

/**
 * Get stored authentication token
 * @returns {string|null} - JWT token or null
 */
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

/**
 * Get stored user role
 * @returns {string|null} - User role or null
 */
export const getUserRole = () => {
    return localStorage.getItem('role');
};

/**
 * Get stored user data
 * @returns {Object|null} - User data or null
 */
export const getUserData = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user has valid token
 */
export const isAuthenticated = () => {
    return !!getAuthToken();
};

/**
 * Logout user and clear stored data
 */
export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
};

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
    const errors = [];
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters`);
    }

    return {
        isValid: errors.length === 0,
        message: errors.length > 0 ? errors.join(', ') : 'Password is strong',
    };
};

export default {
    loginUser,
    registerUser,
    storeAuthData,
    getAuthToken,
    getUserRole,
    getUserData,
    isAuthenticated,
    logoutUser,
    authenticatedFetch,
    isValidEmail,
    validatePassword,
};
