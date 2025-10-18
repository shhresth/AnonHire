'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { FaShieldAlt, FaUser, FaEnvelope, FaLock, FaArrowLeft, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchNonce();
    }
  }, [isConnected, address]);

  async function fetchNonce() {
    if (!address) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      const result = await response.json();
      if (result.success) {
        setNonce(result.data.nonce);
      }
    } catch (error) {
      console.error('Failed to fetch nonce:', error);
    }
  }

  async function handleAuth() {
    if (!address || !nonce) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create message to sign
      const message = `Sign this message to ${isLogin ? 'login' : 'register'}. Nonce: ${nonce}`;
      
      // Sign the message
      const signature = await signer.signMessage(message);
      
      // Send to backend
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          message,
          ...(isLogin ? {} : { email, role }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store JWT token
        localStorage.setItem('jwt', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        setSuccess(isLogin ? 'Login successful!' : 'Registration successful!');
        
        // Redirect based on role
        setTimeout(() => {
          const userRole = result.data.user.role;
          switch (userRole) {
            case 'UNIVERSITY':
              router.push('/issuer/university');
              break;
            case 'EMPLOYER':
              router.push('/issuer/employer');
              break;
            case 'CANDIDATE':
              router.push('/wallet');
              break;
            case 'VERIFIER':
              router.push('/verifier');
              break;
            default:
              router.push('/wallet');
          }
        }, 1500);
      } else {
        if (result.message === 'User not found. Please register first.' && isLogin) {
          // Auto-register if user not found during login
          setIsLogin(false);
          setError('User not found. Please complete registration below.');
        } else {
          setError(result.message || 'Authentication failed');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-16 w-96 bg-gray-300 rounded mx-auto mb-8"></div>
          <div className="h-64 w-96 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              <FaArrowLeft className="text-2xl" />
            </Link>
            <div className="flex items-center space-x-2">
              <FaShieldAlt className="text-blue-600 text-3xl" />
              <h1 className="text-2xl font-bold text-gray-900">AnonHire</h1>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <FaShieldAlt className="text-blue-600 text-3xl" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to your AnonHire account' 
                : 'Join AnonHire and start managing your credentials'
              }
            </p>
          </div>

          {/* Wallet Connection Status */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
              </span>
            </div>
            {isConnected && address && (
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>

          {/* Registration Form (only show when not logged in) */}
          {!isLogin && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CANDIDATE">Candidate</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="VERIFIER">Verifier</option>
                </select>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <FaExclamationTriangle className="text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <FaCheck className="text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            disabled={!isConnected || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaLock />
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isLogin 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <FaShieldAlt className="text-blue-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Secure Authentication</h4>
                <p className="text-xs text-blue-700">
                  Your wallet signature is used for authentication. No private keys are stored or transmitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
