import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  getNonce: (address: string) => api.get(`/auth/nonce/${address}`),
  login: (data: { address: string; signature: string; message: string }) =>
    api.post('/auth/login', data),
  register: (data: { address: string; role: string; email?: string }) =>
    api.post('/auth/register', data),
};

// Credentials API
export const credentialsAPI = {
  issueAcademic: (data: any) => api.post('/credentials/academic', data),
  issueJob: (data: any) => api.post('/credentials/job', data),
  issueInternship: (data: any) => api.post('/credentials/internship', data),
  getCredential: (id: string) => api.get(`/credentials/${id}`),
  getSubjectCredentials: (address: string) => api.get(`/credentials/subject/${address}`),
  getIssuerCredentials: (address: string) => api.get(`/credentials/issuer/${address}`),
  revokeCredential: (id: string, reason: string) =>
    api.post(`/credentials/${id}/revoke`, { reason }),
};

// ZKP API
export const zkpAPI = {
  generateGPAProof: (data: {
    gpa: number;
    threshold: number;
    credentialHash: string;
  }) => api.post('/zkp/gpa/generate', data),
  verifyGPAProof: (data: { proof: any; publicSignals: any }) =>
    api.post('/zkp/gpa/verify', data),
  generateExperienceProof: (data: {
    experienceMonths: number;
    requiredMonths: number;
    credentialHash: string;
  }) => api.post('/zkp/experience/generate', data),
  verifyExperienceProof: (data: { proof: any; publicSignals: any }) =>
    api.post('/zkp/experience/verify', data),
};

// Verification API
export const verificationAPI = {
  verifyCredential: (credentialHash: string) =>
    api.post('/verification/verify', { credentialHash }),
  getVerification: (id: string) => api.get(`/verification/${id}`),
  getCredentialVerifications: (credentialId: string) =>
    api.get(`/verification/credential/${credentialId}`),
};

// DID API
export const didAPI = {
  registerDID: (data: { did: string; publicKeyPem: string; serviceEndpoint?: string }) =>
    api.post('/did/register', data),
  resolveDID: (address: string) => api.get(`/did/${address}`),
};

export default api;


