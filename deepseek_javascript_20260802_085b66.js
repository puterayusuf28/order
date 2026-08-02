// ============================================
// CONFIGURATION FILE
// ============================================

// GANTI DENGAN URL GOOGLE APPS SCRIPT ANDA
const APP_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    STORE_NAME: 'Putra Yusuf Laundry',
    VERSION: '1.0.0'
};

// Export untuk digunakan di script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}