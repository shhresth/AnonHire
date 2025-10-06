'use client';

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600 flex justify-between items-center">
        <span>© {new Date().getFullYear()} AnonHire</span>
        <span className="space-x-4">
          <a className="hover:underline" href="#">Docs</a>
          <a className="hover:underline" href="#">Support</a>
        </span>
      </div>
    </footer>
  );
}


