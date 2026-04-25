'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaArrowLeft } from 'react-icons/fa';

export default function TopNav({ title, accent = 'blue' }: { title: string; accent?: 'blue' | 'green' | 'red' }) {
  const accentClass =
    accent === 'green'
      ? 'text-green-600 hover:text-green-700'
      : accent === 'red'
        ? 'text-red-600 hover:text-red-700'
        : 'text-blue-600 hover:text-blue-700';
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className={accentClass}>
            <FaArrowLeft className="text-2xl" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}


