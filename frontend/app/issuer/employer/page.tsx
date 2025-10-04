'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaBriefcase, FaUserTie, FaCheck } from 'react-icons/fa';

export default function EmployerIssuerPage() {
  const [formData, setFormData] = useState({
    subjectAddress: '',
    employeeName: '',
    position: '',
    companyName: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/credentials/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.isCurrent ? null : new Date(formData.endDate).toISOString(),
        }),
      });
      
      const result = await response.json();
      setResult(result);
      
      if (response.ok) {
        // Reset form on success
        setFormData({
          subjectAddress: '',
          employeeName: '',
          position: '',
          companyName: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
        });
      }
    } catch (error) {
      console.error('Failed to issue credential:', error);
      setResult({ error: 'Failed to issue credential' });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaBriefcase className="text-green-600 text-3xl" />
            <h1 className="text-2xl font-bold text-gray-900">AnonHire - Employer Issuer</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Issue Job Credentials
          </h2>
          <p className="text-xl text-gray-600">
            Issue verifiable employment credentials to your employees
          </p>
        </div>

        {/* Issue Credential Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Employee Information</h3>
          
          <form onSubmit={handleIssueCredential} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subjectAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Wallet Address *
                </label>
                <input
                  type="text"
                  id="subjectAddress"
                  name="subjectAddress"
                  value={formData.subjectAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Name *
                </label>
                <input
                  type="text"
                  id="employeeName"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Software Engineer"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Tech Corp"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={formData.isCurrent}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isCurrent"
                name="isCurrent"
                checked={formData.isCurrent}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
                Currently employed
              </label>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Brief description of the role and responsibilities..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={isIssuing}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isIssuing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Issuing Credential...</span>
                </>
              ) : (
                <>
                  <FaUserTie />
                  <span>Issue Job Credential</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Result</h3>
            
            {result.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <div className="text-green-600">
                <div className="flex items-center space-x-3 mb-4">
                  <FaCheck className="text-2xl" />
                  <span className="font-semibold">Credential Issued Successfully!</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Credential Hash:</strong> {result.credentialHash}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Transaction Hash:</strong> {result.txHash}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-green-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-green-800">
            <li>Connect your company wallet using the button above</li>
            <li>Fill in all the required employee information</li>
            <li>Check "Currently employed" if the employee is still working</li>
            <li>Click "Issue Job Credential" to create the credential</li>
            <li>The credential will be stored on IPFS and recorded on blockchain</li>
            <li>Share the credential hash with the employee</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
