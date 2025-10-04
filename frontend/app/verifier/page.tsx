'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaCheck, FaTimes, FaSearch, FaShieldAlt } from 'react-icons/fa';

export default function VerifierPage() {
  const [credentialHash, setCredentialHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!credentialHash) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch(`http://localhost:3001/api/v1/verification/verify/${credentialHash}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({ error: 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="text-blue-600 text-3xl" />
            <h1 className="text-2xl font-bold text-gray-900">AnonHire - Verifier</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Credentials
          </h2>
          <p className="text-xl text-gray-600">
            Verify the authenticity of employment credentials using blockchain technology
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Enter Credential Hash</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="credentialHash" className="block text-sm font-medium text-gray-700 mb-2">
                Credential Hash
              </label>
              <input
                type="text"
                id="credentialHash"
                value={credentialHash}
                onChange={(e) => setCredentialHash(e.target.value)}
                placeholder="Enter the credential hash to verify"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleVerify}
              disabled={!credentialHash || isVerifying}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Verify Credential</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Verification Result</h3>
            
            {verificationResult.error ? (
              <div className="flex items-center space-x-3 text-red-600">
                <FaTimes className="text-2xl" />
                <div>
                  <p className="font-semibold">Verification Failed</p>
                  <p className="text-sm">{verificationResult.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-green-600">
                  <FaCheck className="text-2xl" />
                  <span className="font-semibold">Credential Verified Successfully</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Credential Details</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {verificationResult.credentialType || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Issued:</strong> {verificationResult.issuedAt ? new Date(verificationResult.issuedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> {verificationResult.isRevoked ? 'Revoked' : 'Active'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Blockchain Info</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Transaction:</strong> {verificationResult.txHash ? `${verificationResult.txHash.slice(0, 10)}...` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Verified:</strong> {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Verify Credentials</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Ask the candidate to provide their credential hash</li>
            <li>Enter the hash in the field above</li>
            <li>Click "Verify Credential" to check authenticity</li>
            <li>View the verification result and credential details</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
