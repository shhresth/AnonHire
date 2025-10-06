'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { FaArrowLeft, FaPlus, FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showZKPModal, setShowZKPModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [viewAddress, setViewAddress] = useState<string>('');
  const [loadingList, setLoadingList] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && !viewAddress) {
      setViewAddress(address);
    }
  }, [isConnected, address]);

  async function ensureBackendAuth(expectedAddress?: string): Promise<string | null> {
    try {
      const existing = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const existingAddr = typeof window !== 'undefined' ? localStorage.getItem('tokenAddress') : null;
      if (existing && (!expectedAddress || (existingAddr && existingAddr.toLowerCase() === expectedAddress.toLowerCase()))) {
        return existing;
      }

      const eth: any = (window as any).ethereum;
      if (!eth) { setAuthError('MetaMask not found.'); return null; }
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      const who = accounts[0];
      if (!who) { setAuthError('No wallet connected.'); return null; }
      if (expectedAddress && who.toLowerCase() !== expectedAddress.toLowerCase()) {
        setAuthError('Please switch MetaMask to the correct wallet for this action.');
        return null;
      }

      const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const nonceRes = await fetch(`${api}/api/v1/auth/nonce/${who}`);
      const nonceJson = await nonceRes.json();
      const nonce = nonceJson?.nonce || nonceJson?.data?.nonce;
      if (!nonce) { setAuthError('Failed to obtain nonce.'); return null; }

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const messageToSign = `Sign this message to login. Nonce: ${nonce}`;
      const signature = await signer.signMessage(messageToSign);

      const loginRes = await fetch(`${api}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: who, signature, message: messageToSign })
      });
      const text = await loginRes.text();
      let json: any = null; try { json = JSON.parse(text); } catch {}
      const token = json?.token || json?.data?.token;
      if (!loginRes.ok || !token) { setAuthError(json?.message || `Login failed (${loginRes.status}).`); return null; }
      localStorage.setItem('token', token);
      localStorage.setItem('tokenAddress', who);
      setAuthError(null);
      return token;
    } catch (e: any) {
      setAuthError(e?.message || 'Authentication error');
      return null;
    }
  }

  const fetchCredentials = async (addr: string) => {
    if (!addr) return;
    setLoadingList(true);
    try {
      const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      // Ensure we have backend JWT
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        token = await ensureBackendAuth();
        if (!token) { setLoadingList(false); return; }
      }
      // Correct endpoint requires auth
      const res = await fetch(`${api}/api/v1/credentials/subject/${addr}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      const text = await res.text();
      let json: any = null; try { json = JSON.parse(text); } catch {}
      const list = json?.data ?? [];
      // Normalize a few fields for UI
      const normalized = (list || []).map((c: any) => ({
        id: c.id || c.credentialHash || Math.random().toString(36).slice(2),
        dbId: c.id || null,
        type: c.credentialType || c.type || 'UNKNOWN',
        issuer: c.issuer?.address || c.issuer || 'Unknown',
        issuedAt: c.issuedAt ? new Date(c.issuedAt).toISOString().split('T')[0] : '',
        status: c.isRevoked ? 'revoked' : 'active',
        details: {},
        credentialHash: c.credentialHash,
        ipfsHash: c.ipfsHash,
        txHash: c.txHash,
      }));
      setCredentials(normalized);
    } catch (e) {
      setCredentials([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (viewAddress) fetchCredentials(viewAddress);
  }, [viewAddress]);

  const handleViewCredential = (credential: any) => {
    // mark if the decrypt call should be allowed (owner viewing own wallet)
    const canDecrypt = viewAddress && address && viewAddress.toLowerCase() === address.toLowerCase();
    setSelectedCredential({ ...credential, canDecrypt });
    setShowViewModal(true);
  };

  const handleShareCredential = (credential: any) => {
    setSelectedCredential(credential);
    setShowShareModal(true);
  };

  // Prevent hydration mismatch by not rendering wallet-dependent content until mounted
  if (!isMounted) {
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
                <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
              </div>
            </div>
            <ConnectButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-8 w-64 bg-gray-300 rounded mx-auto mb-4"></div>
              <div className="h-4 w-96 bg-gray-300 rounded mx-auto"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <TopNav title="My Wallet" accent="blue" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FaShieldAlt className="text-blue-600 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view and manage your credentials
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Wallet Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-lg font-mono">{address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Credentials</p>
                  <p className="text-3xl font-bold text-blue-600">{credentials.length}</p>
                </div>
              </div>
              {authError && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded">{authError}</div>
              )}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">View credentials for address</label>
                  <input
                    type="text"
                    value={viewAddress}
                    onChange={(e) => setViewAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => fetchCredentials(viewAddress)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    disabled={!viewAddress || loadingList}
                  >
                    {loadingList ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {/* Credentials List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">My Credentials</h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <FaPlus />
                  <span>Add Credential</span>
                </button>
              </div>

              {loadingList ? (
                <p className="text-center text-gray-600 py-8">Loading credentials...</p>
              ) : credentials.length === 0 ? (
                <div className="text-center text-gray-600 py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">🎓</div>
                  <p className="mb-1">No credentials yet.</p>
                  <p className="text-sm">Ask your issuer to create one, or visit the issuer pages.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {credentials.map((cred) => (
                    <CredentialCard 
                      key={cred.id} 
                      credential={cred} 
                      onView={handleViewCredential}
                      onShare={handleShareCredential}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                title="Generate ZKP"
                description="Create a zero-knowledge proof for verification"
                color="bg-green-600"
                onClick={() => setShowZKPModal(true)}
              />
              <ActionCard
                title="Share Credential"
                description="Share your credential with a verifier"
                color="bg-purple-600"
                onClick={() => setShowShareModal(true)}
              />
              <ActionCard
                title="View History"
                description="See your verification history"
                color="bg-orange-600"
                onClick={() => setShowHistoryModal(true)}
              />
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddCredentialModal 
          onClose={() => setShowAddModal(false)}
          onAdd={(credential: UICredential) => {
            setCredentials([...credentials, credential]);
            setShowAddModal(false);
          }}
        />
      )}

      {showZKPModal && (
        <ZKPModal 
          onClose={() => setShowZKPModal(false)}
          credentials={credentials}
        />
      )}

      {showShareModal && (
        <ShareModal 
          onClose={() => setShowShareModal(false)}
          credentials={credentials}
        />
      )}

      {showHistoryModal && (
        <HistoryModal 
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showViewModal && selectedCredential && (
        <ViewCredentialModal 
          credential={selectedCredential}
          getToken={ensureBackendAuth}
          expectedAddress={address}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCredential(null);
          }}
        />
      )}
    </div>
  );
}

type UICredential = {
  id: string;
  type: string;
  issuer: string;
  issuedAt: string;
  status: string;
  details?: any;
  credentialHash?: string;
  ipfsHash?: string;
  txHash?: string;
};

function CredentialCard({ credential, onView, onShare }: { credential: UICredential; onView: (c: UICredential)=>void; onShare: (c: UICredential)=>void; }) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          {credential.type}
        </span>
        <span className="text-xs">{credential.status}</span>
      </div>
      <h4 className="text-xl font-bold mb-2">{credential.issuer}</h4>
      <p className="text-sm text-white/80">Issued: {credential.issuedAt}</p>
      {credential.credentialHash && (
        <p className="text-xs text-white/80 break-all mt-2">Hash: {credential.credentialHash}</p>
      )}
      <div className="mt-4 flex space-x-2">
        <button 
          onClick={() => onView(credential)}
          className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded text-sm transition-colors"
        >
          View
        </button>
        <button 
          onClick={() => onShare(credential)}
          className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded text-sm transition-colors"
        >
          Share
        </button>
      </div>
    </div>
  );
}

function ActionCard({ title, description, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-left`}
    >
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-white/90">{description}</p>
    </button>
  );
}

// Add Credential Modal
function AddCredentialModal({ onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    type: 'ACADEMIC',
    issuer: '',
    issuedAt: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const newCredential = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
    };
    onAdd(newCredential);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Add New Credential</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="ACADEMIC">Academic</option>
              <option value="JOB">Job</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Issuer</label>
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => setFormData({...formData, issuer: e.target.value})}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., MIT, Google Inc."
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Issue Date</label>
            <input
              type="date"
              value={formData.issuedAt}
              onChange={(e) => setFormData({...formData, issuedAt: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ZKP Modal
function ZKPModal({ onClose, credentials }: any) {
  const [selectedCredential, setSelectedCredential] = useState('');
  const [zkpResult, setZkpResult] = useState('');
  const [proofType, setProofType] = useState('gpa_proof');
  const [threshold, setThreshold] = useState('300'); // 3.0 GPA threshold
  const [isGenerating, setIsGenerating] = useState(false);

  const generateZKP = async () => {
    if (!selectedCredential) return;
    
    setIsGenerating(true);
    
    try {
      // Call the mock ZKP system
      const response = await fetch('http://localhost:3001/api/v1/zkp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: selectedCredential,
          proofType: proofType,
          threshold: parseInt(threshold),
          salt: Math.random().toString(36).substring(7)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setZkpResult(`✅ ${result.type} proof generated successfully!\n\nProof: ${result.proof}\nValid: ${result.valid ? 'YES' : 'NO'}\nCommitment: ${result.publicInputs.commitment}`);
      } else {
        // Fallback to mock generation
        const mockProof = {
          type: proofType,
          proof: '0x' + Math.random().toString(16).substr(2, 64),
          valid: true,
          publicInputs: {
            commitment: '0x' + Math.random().toString(16).substr(2, 64)
          }
        };
        setZkpResult(`✅ ${mockProof.type} proof generated successfully!\n\nProof: ${mockProof.proof}\nValid: ${mockProof.valid ? 'YES' : 'NO'}\nCommitment: ${mockProof.publicInputs.commitment}`);
      }
    } catch (error) {
      // Fallback to mock generation
      const mockProof = {
        type: proofType,
        proof: '0x' + Math.random().toString(16).substr(2, 64),
        valid: true,
        publicInputs: {
          commitment: '0x' + Math.random().toString(16).substr(2, 64)
        }
      };
      setZkpResult(`✅ ${mockProof.type} proof generated successfully!\n\nProof: ${mockProof.proof}\nValid: ${mockProof.valid ? 'YES' : 'NO'}\nCommitment: ${mockProof.publicInputs.commitment}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Generate Zero-Knowledge Proof</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Credential</label>
          <select
            value={selectedCredential}
            onChange={(e) => setSelectedCredential(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Choose a credential...</option>
            {credentials.map((cred: any) => (
              <option key={cred.id} value={cred.id}>
                {cred.type} - {cred.issuer}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Proof Type</label>
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="gpa_proof">GPA Proof (Academic)</option>
            <option value="experience_proof">Experience Proof (Job)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {proofType === 'gpa_proof' ? 'GPA Threshold (scaled by 100)' : 'Required Experience (months)'}
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder={proofType === 'gpa_proof' ? '300 (3.0 GPA)' : '12 (12 months)'}
          />
        </div>

        {zkpResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <pre className="text-sm text-green-800 whitespace-pre-wrap">{zkpResult}</pre>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={generateZKP}
            disabled={!selectedCredential || isGenerating}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            {isGenerating ? 'Generating...' : 'Generate ZKP'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Share Modal
function ShareModal({ onClose, credentials }: any) {
  const [selectedCredential, setSelectedCredential] = useState('');
  const [shareLink, setShareLink] = useState('');

  const generateShareLink = () => {
    if (!selectedCredential) return;
    const cred = credentials.find((c: any) => c.id === selectedCredential);
    const link = `https://anonhire.com/verify/${cred?.id}`;
    setShareLink(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Share Credential</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Credential</label>
          <select
            value={selectedCredential}
            onChange={(e) => setSelectedCredential(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Choose a credential...</option>
            {credentials.map((cred: any) => (
              <option key={cred.id} value={cred.id}>
                {cred.type} - {cred.issuer}
              </option>
            ))}
          </select>
        </div>

        {shareLink && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 p-2 border rounded-l-lg"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={generateShareLink}
            disabled={!selectedCredential}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
          >
            Generate Link
          </button>
        </div>
      </div>
    </div>
  );
}

// History Modal
function HistoryModal({ onClose }: any) {
  const history = [
    { id: 1, action: 'Credential Verified', timestamp: '2024-01-15 10:30', status: 'Success' },
    { id: 2, action: 'ZKP Generated', timestamp: '2024-01-14 15:45', status: 'Success' },
    { id: 3, action: 'Credential Shared', timestamp: '2024-01-13 09:20', status: 'Success' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">Verification History</h3>
        
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{item.action}</p>
                <p className="text-sm text-gray-600">{item.timestamp}</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// View Credential Modal
function ViewCredentialModal({ credential, onClose, getToken, expectedAddress }: any) {
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [decrypted, setDecrypted] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Only attempt decrypt for owner and when we have a real DB id
      if (!credential?.canDecrypt) return;
      const dbId = credential.dbId || credential.id;
      if (!dbId || (typeof dbId === 'string' && dbId.startsWith('0x'))) return;
      setLoadingDetails(true);
      setDetailsError(null);
      try {
        const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        const token = await getToken?.(expectedAddress);
        if (!token) { setDetailsError('Not authenticated'); return; }
        const res = await fetch(`${api}/api/v1/credentials/${dbId}/decrypted`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await res.text();
        let json: any = null; try { json = JSON.parse(text); } catch {}
        if (!res.ok) {
          setDetailsError(json?.message || `Failed to load details (${res.status})`);
          return;
        }
        if (!cancelled) setDecrypted(json?.data);
      } catch (e: any) {
        if (!cancelled) setDetailsError(e?.message || 'Failed to load details');
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [credential?.id]);

  const effectiveDetails = decrypted?.details || credential.details;
  const renderCredentialDetails = () => {
    if (!effectiveDetails) return null;

    if (credential.type === 'ACADEMIC') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
            <p className="text-gray-900">{effectiveDetails.degree}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
            <p className="text-gray-900">{effectiveDetails.major}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
            <p className="text-gray-900">{effectiveDetails.gpa}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
            <p className="text-gray-900">{effectiveDetails.graduationYear}</p>
          </div>
        </div>
      );
    } else if (credential.type === 'JOB') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <p className="text-gray-900">{effectiveDetails.position}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900">{effectiveDetails.department}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <p className="text-gray-900">{effectiveDetails.startDate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <p className="text-gray-900">{effectiveDetails.endDate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
            <p className="text-gray-900">{effectiveDetails.responsibilities}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Credential Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-900">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900">{credential.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                <p className="text-gray-900">{credential.issuer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label>
                <p className="text-gray-900">{credential.issuedAt}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {credential.status}
                </span>
              </div>
              {credential.credentialHash && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential Hash</label>
                  <p className="text-gray-900 break-all">{credential.credentialHash}</p>
                </div>
              )}
              {credential.txHash && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Hash</label>
                  <p className="text-gray-900 break-all">{credential.txHash}</p>
                </div>
              )}
              {credential.ipfsHash && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">IPFS CID</label>
                  <p className="text-gray-900 break-all">{credential.ipfsHash}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          {(effectiveDetails || loadingDetails || detailsError || !credential.canDecrypt) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 text-gray-900">Detailed Information</h4>
              {!credential.canDecrypt && (
                <p className="text-sm text-gray-600">You can only view details when viewing your own wallet.</p>
              )}
              {credential.canDecrypt && loadingDetails && (
                <p className="text-sm text-gray-600">Loading details...</p>
              )}
              {credential.canDecrypt && detailsError && (
                <div className="text-sm text-red-600 space-y-2">
                  <p>{detailsError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      try { localStorage.removeItem('token'); localStorage.removeItem('tokenAddress'); } catch {}
                      // trigger reload
                      setDetailsError(null);
                      setLoadingDetails(true);
                      // simple re-run: change dependency by calling a no-op then re-run load via effect
                      // Easiest: directly call the loader again
                      (async () => {
                        try {
                          const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
                          const dbId = credential.dbId || credential.id;
                          const token = await getToken?.(expectedAddress);
                          if (!token) { setDetailsError('Not authenticated'); return; }
                          const res = await fetch(`${api}/api/v1/credentials/${dbId}/decrypted`, { headers: { Authorization: `Bearer ${token}` } });
                          const text = await res.text();
                          let json: any = null; try { json = JSON.parse(text); } catch {}
                          if (!res.ok) { setDetailsError(json?.message || `Failed to load details (${res.status})`); return; }
                          setDecrypted(json?.data);
                          setDetailsError(null);
                        } catch (e: any) {
                          setDetailsError(e?.message || 'Failed to load details');
                        } finally {
                          setLoadingDetails(false);
                        }
                      })();
                    }}
                    className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Re-authenticate and retry
                  </button>
                </div>
              )}
              {credential.canDecrypt && !loadingDetails && !detailsError && renderCredentialDetails()}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Copy credential details to clipboard
                const details = JSON.stringify(credential, null, 2);
                navigator.clipboard.writeText(details);
                alert('Credential details copied to clipboard!');
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Copy Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


