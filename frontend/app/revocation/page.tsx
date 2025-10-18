'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { FaArrowLeft, FaBan, FaCheck, FaExclamationTriangle, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';

interface RevokedCredential {
  id: string;
  credentialHash: string;
  credentialType: string;
  issuer: string;
  subject: string;
  revokedAt: string;
  revocationReason: string;
  txHash?: string;
}

export default function RevocationPage() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokedCredentials, setRevokedCredentials] = useState<RevokedCredential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('jwt');
    setJwt(token);
  }, []);

  useEffect(() => {
    if (isConnected && address && jwt) {
      fetchRevokedCredentials();
    }
  }, [isConnected, address, jwt]);

  async function fetchRevokedCredentials() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/credentials/revoked`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setRevokedCredentials(result.data);
      } else {
        setError(result.message || 'Failed to fetch revoked credentials');
      }
    } catch (error: any) {
      console.error('Failed to fetch revoked credentials:', error);
      setError('Failed to fetch revoked credentials');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getCredentialTypeColor(type: string) {
    switch (type) {
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-800';
      case 'JOB':
        return 'bg-green-100 text-green-800';
      case 'INTERNSHIP':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const filteredCredentials = revokedCredentials.filter(credential => {
    const matchesSearch = 
      credential.credentialHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.revocationReason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'ALL' || credential.credentialType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-300"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-300 rounded mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TopNav title="Revocation Registry" accent="red" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Revocation Registry</h1>
              <p className="text-gray-600">
                View and manage revoked credentials across the platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <FaBan className="text-red-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revoked</p>
                <p className="text-2xl font-bold text-gray-900">{revokedCredentials.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FaExclamationTriangle className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Academic</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revokedCredentials.filter(c => c.credentialType === 'ACADEMIC').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FaExclamationTriangle className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Job</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revokedCredentials.filter(c => c.credentialType === 'JOB').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <FaExclamationTriangle className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Internship</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revokedCredentials.filter(c => c.credentialType === 'INTERNSHIP').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by hash, issuer, subject, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Types</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="JOB">Job</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
              <button
                onClick={fetchRevokedCredentials}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading revoked credentials...</p>
          </div>
        )}

        {/* Revoked Credentials List */}
        {!loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredCredentials.length === 0 ? (
              <div className="text-center py-12">
                <FaBan className="text-gray-400 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Revoked Credentials</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'ALL' 
                    ? 'No credentials match your search criteria.' 
                    : 'No credentials have been revoked yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credential
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issuer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revoked At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCredentials.map((credential) => (
                      <tr key={credential.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {credential.credentialHash.slice(0, 10)}...
                          </div>
                          <div className="text-xs text-gray-500">
                            {credential.credentialHash.slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCredentialTypeColor(credential.credentialType)}`}>
                            {credential.credentialType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {credential.issuer.slice(0, 6)}...{credential.issuer.slice(-4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {credential.subject.slice(0, 6)}...{credential.subject.slice(-4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(credential.revokedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {credential.revocationReason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => copyToClipboard(credential.credentialHash, 'Credential Hash')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Copy Hash
                            </button>
                            {credential.txHash && (
                              <button
                                onClick={() => copyToClipboard(credential.txHash!, 'Transaction Hash')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Copy TX
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
