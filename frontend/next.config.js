/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
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


