'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaShieldAlt, FaUserGraduate, FaBriefcase, FaCheck } from 'react-icons/fa';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaShieldAlt className="text-blue-600 text-3xl" />
              <h1 className="text-2xl font-bold text-gray-900">AnonHire</h1>
            </div>
            <div className="animate-pulse">
              <div className="h-10 w-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-16 w-96 bg-gray-300 rounded mx-auto mb-8"></div>
            <div className="h-4 w-64 bg-gray-300 rounded mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="text-blue-600 text-3xl" />
            <h1 className="text-2xl font-bold text-gray-900">AnonHire</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Employment Credential Verification
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Secure, privacy-preserving verification of academic, internship, and job credentials
            using blockchain and zero-knowledge proofs.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              href="/wallet"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Open Wallet
            </Link>
            <Link
              href="/verifier"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              Verify Credentials
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<FaShieldAlt className="text-blue-600 text-4xl" />}
            title="Privacy-First"
            description="Prove your qualifications without revealing sensitive details using zero-knowledge proofs"
          />
          <FeatureCard
            icon={<FaUserGraduate className="text-blue-600 text-4xl" />}
            title="Academic Credentials"
            description="Universities issue verifiable academic credentials stored on IPFS and blockchain"
          />
          <FeatureCard
            icon={<FaBriefcase className="text-blue-600 text-4xl" />}
            title="Work Experience"
            description="Employers verify job credentials and internships securely and instantly"
          />
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Issue Credentials"
              description="Universities and employers issue verifiable credentials to candidates"
            />
            <StepCard
              number="2"
              title="Store in Wallet"
              description="Candidates store their credentials securely in their digital wallet"
            />
            <StepCard
              number="3"
              title="Generate Proofs"
              description="Share zero-knowledge proofs with verifiers without revealing full details"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RoleCard
              href="/issuer/university"
              title="University"
              description="Issue academic credentials"
              color="bg-blue-600"
            />
            <RoleCard
              href="/issuer/employer"
              title="Employer"
              description="Issue job credentials"
              color="bg-green-600"
            />
            <RoleCard
              href="/wallet"
              title="Candidate"
              description="Manage your credentials"
              color="bg-purple-600"
            />
            <RoleCard
              href="/verifier"
              title="Verifier"
              description="Verify credentials"
              color="bg-orange-600"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-gray-600">
            © 2025 AnonHire. Built with blockchain, IPFS, and zero-knowledge proofs.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 relative">
      <div className="absolute -top-4 left-8 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-2 mt-4">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function RoleCard({ href, title, description, color }: any) {
  return (
    <Link
      href={href}
      className={`${color} text-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105`}
    >
      <h4 className="text-2xl font-bold mb-2">{title}</h4>
      <p className="text-white/90">{description}</p>
    </Link>
  );
}


