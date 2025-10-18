'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaShieldAlt, FaUserGraduate, FaBriefcase, FaCheck, FaLock, FaGlobe, FaCertificate, FaUsers, FaArrowRight, FaPlay } from 'react-icons/fa';

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
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="text-blue-600 text-3xl" />
            <h1 className="text-2xl font-bold text-gray-900">AnonHire</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</Link>
            <Link href="#roles" className="text-gray-600 hover:text-blue-600 transition-colors">Get Started</Link>
            <Link href="/auth" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
            <Link href="/verifier" className="text-gray-600 hover:text-blue-600 transition-colors">Verify</Link>
          </nav>
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
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/wallet"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <span>Open Wallet</span>
              <FaArrowRight />
            </Link>
            <Link
              href="/verifier"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <FaPlay />
              <span>Verify Credentials</span>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AnonHire?
          </h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FaShieldAlt className="text-blue-600 text-4xl" />}
              title="Privacy-First"
              description="Prove your qualifications without revealing sensitive details using zero-knowledge proofs"
            />
            <FeatureCard
              icon={<FaLock className="text-green-600 text-4xl" />}
              title="Blockchain Security"
              description="Immutable credential storage on Ethereum with IPFS for decentralized data"
            />
            <FeatureCard
              icon={<FaUserGraduate className="text-purple-600 text-4xl" />}
              title="Academic Credentials"
              description="Universities issue verifiable academic credentials stored on IPFS and blockchain"
            />
            <FeatureCard
              icon={<FaBriefcase className="text-orange-600 text-4xl" />}
              title="Work Experience"
              description="Employers verify job credentials and internships securely and instantly"
            />
            <FeatureCard
              icon={<FaGlobe className="text-indigo-600 text-4xl" />}
              title="Decentralized"
              description="No single point of failure with distributed storage and verification"
            />
            <FeatureCard
              icon={<FaCertificate className="text-red-600 text-4xl" />}
              title="Tamper-Proof"
              description="Cryptographic signatures ensure credential authenticity and integrity"
            />
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="mt-24">
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
        <div id="roles" className="mt-24">
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

        {/* Statistics */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Platform Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard
              number="1,000+"
              label="Credentials Issued"
              icon={<FaCertificate className="text-blue-600 text-3xl" />}
            />
            <StatCard
              number="50+"
              label="Institutions"
              icon={<FaUsers className="text-green-600 text-3xl" />}
            />
            <StatCard
              number="99.9%"
              label="Uptime"
              icon={<FaShieldAlt className="text-purple-600 text-3xl" />}
            />
            <StatCard
              number="24/7"
              label="Verification"
              icon={<FaGlobe className="text-orange-600 text-3xl" />}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaShieldAlt className="text-blue-400 text-2xl" />
                <h3 className="text-xl font-bold">AnonHire</h3>
              </div>
              <p className="text-gray-400">
                Secure, privacy-preserving credential verification using blockchain and zero-knowledge proofs.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
                <li><Link href="/verifier" className="hover:text-white transition-colors">Verifier</Link></li>
                <li><Link href="/issuer/university" className="hover:text-white transition-colors">University</Link></li>
                <li><Link href="/issuer/employer" className="hover:text-white transition-colors">Employer</Link></li>
                <li><Link href="/revocation" className="hover:text-white transition-colors">Revocation Registry</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#roles" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Ethereum Blockchain</li>
                <li>IPFS Storage</li>
                <li>Zero-Knowledge Proofs</li>
                <li>Smart Contracts</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 AnonHire. Built with blockchain, IPFS, and zero-knowledge proofs.</p>
          </div>
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
      className={`${color} text-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 group`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-bold mb-2">{title}</h4>
          <p className="text-white/90">{description}</p>
        </div>
        <FaArrowRight className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}

function StatCard({ number, label, icon }: any) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}


