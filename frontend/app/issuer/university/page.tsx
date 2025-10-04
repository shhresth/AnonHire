'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaGraduationCap, FaUserGraduate, FaCheck } from 'react-icons/fa';

export default function UniversityIssuerPage() {
  const [formData, setFormData] = useState({
    subjectAddress: '',
    studentName: '',
    degree: '',
    major: '',
    gpa: '',
    graduationYear: '',
    universityName: '',
  });
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/credentials/academic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          gpa: parseFloat(formData.gpa),
          graduationYear: parseInt(formData.graduationYear),
        }),
      });
      
      const result = await response.json();
      setResult(result);
      
      if (response.ok) {
        // Reset form on success
        setFormData({
          subjectAddress: '',
          studentName: '',
          degree: '',
          major: '',
          gpa: '',
          graduationYear: '',
          universityName: '',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaGraduationCap className="text-blue-600 text-3xl" />
            <h1 className="text-2xl font-bold text-gray-900">AnonHire - University Issuer</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Issue Academic Credentials
          </h2>
          <p className="text-xl text-gray-600">
            Issue verifiable academic credentials to students
          </p>
        </div>

        {/* Issue Credential Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Student Information</h3>
          
          <form onSubmit={handleIssueCredential} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subjectAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Student Wallet Address *
                </label>
                <input
                  type="text"
                  id="subjectAddress"
                  name="subjectAddress"
                  value={formData.subjectAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
                  Degree *
                </label>
                <select
                  id="degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Degree</option>
                  <option value="Bachelor of Science">Bachelor of Science</option>
                  <option value="Bachelor of Arts">Bachelor of Arts</option>
                  <option value="Master of Science">Master of Science</option>
                  <option value="Master of Arts">Master of Arts</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                  Major *
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  placeholder="Computer Science"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 mb-2">
                  GPA *
                </label>
                <input
                  type="number"
                  id="gpa"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleInputChange}
                  placeholder="3.75"
                  min="0"
                  max="4"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year *
                </label>
                <input
                  type="number"
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  placeholder="2024"
                  min="1900"
                  max="2100"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="universityName" className="block text-sm font-medium text-gray-700 mb-2">
                University Name *
              </label>
              <input
                type="text"
                id="universityName"
                name="universityName"
                value={formData.universityName}
                onChange={handleInputChange}
                placeholder="University of Technology"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={isIssuing}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isIssuing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Issuing Credential...</span>
                </>
              ) : (
                <>
                  <FaUserGraduate />
                  <span>Issue Academic Credential</span>
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
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Connect your university wallet using the button above</li>
            <li>Fill in all the required student information</li>
            <li>Click "Issue Academic Credential" to create the credential</li>
            <li>The credential will be stored on IPFS and recorded on blockchain</li>
            <li>Share the credential hash with the student</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
