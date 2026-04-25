const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Expose selected envs (loaded from root .env) to the browser at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_AES_SECRET_KEY: process.env.AES_SECRET_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      '@react-native-async-storage/async-storage': false,
      'react-native': false
    };
    config.externals.push('pino-pretty', 'encoding');
    
    // Ignore MetaMask SDK warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/,
      /WalletConnect Core is already initialized/,
      /Multiple versions of Lit loaded/
    ];
    
    return config;
  },
};

module.exports = nextConfig;


