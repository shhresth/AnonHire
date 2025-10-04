# AnonHire - Employment Credential Verification System

A secure, scalable system for verifying academic, internship, and job credentials using **Self-Sovereign Identity (SSI)**, **IPFS**, and **Zero-Knowledge Proofs (ZKPs)**.

## 🎯 Features

- **Self-Sovereign Identity**: Candidates control their own credentials
- **Privacy-Preserving Verification**: Prove qualifications without revealing sensitive details
- **Blockchain-Based Integrity**: Immutable credential records on Ethereum/Polygon
- **Decentralized Storage**: IPFS for credential metadata
- **Zero-Knowledge Proofs**: Verify GPA, experience, and skills without disclosure
- **Role-Based Access Control**: Separate interfaces for issuers, holders, and verifiers
- **Revocation Support**: On-chain revocation registry
- **Enterprise-Ready**: Docker, CI/CD, and production deployment support

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  University │     │  Employer   │     │  Internship │
│  Dashboard  │     │  Dashboard  │     │  Provider   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │ Issue Credentials
                           ▼
                  ┌────────────────┐
                  │  Backend API   │
                  │  + Smart       │
                  │  Contracts     │
                  └────────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │   IPFS   │  │Blockchain│  │  ZKP     │
       │ Storage  │  │ (Polygon)│  │ Circuits │
       └──────────┘  └──────────┘  └──────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   Candidate    │
                  │    Wallet      │
                  └────────┬───────┘
                           │ Share Proof
                           ▼
                  ┌────────────────┐
                  │    Verifier    │
                  │    Portal      │
                  └────────────────┘
```

## 📁 Project Structure

```
AnonHire/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   │   ├── CredentialRegistry.sol
│   │   ├── DIDRegistry.sol
│   │   ├── RevocationRegistry.sol
│   │   └── VerifiableCredential.sol
│   ├── test/
│   └── scripts/
├── zkp/               # Zero-Knowledge Proof circuits
│   ├── circuits/
│   │   ├── gpa_proof.circom
│   │   └── experience_proof.circom
│   └── scripts/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   └── tests/
├── frontend/          # React + Next.js
│   ├── components/
│   ├── pages/
│   │   ├── wallet/
│   │   ├── issuer/
│   │   └── verifier/
│   └── utils/
├── scripts/           # Deployment scripts
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Docker & Docker Compose
- MetaMask or similar Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   cd AnonHire
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker**
   ```bash
   npm run docker:up
   ```

   Or start services individually:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

### Deployment

1. **Deploy Smart Contracts**
   ```bash
   cd contracts
   npm run deploy:sepolia  # or deploy:mumbai
   ```

2. **Setup ZKP Circuits**
   ```bash
   cd zkp
   npm run setup
   ```

3. **Update contract addresses in .env**

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific modules
npm run test:contracts
npm run test:backend
npm run test:frontend
```

## 📋 Demo Scenarios

### Scenario 1: Fresher with GPA Proof
1. University issues academic credential
2. Candidate stores credential in wallet
3. Recruiter requests proof of GPA ≥ 3.5
4. Candidate generates ZKP (proves GPA without revealing transcript)
5. Recruiter verifies proof on-chain

### Scenario 2: Experienced Candidate
1. Previous employer issues job credential (3 years)
2. New employer requests proof of ≥3 years experience
3. Candidate generates ZKP (proves experience without details)
4. Employer verifies instantly

### Scenario 3: Credential Revocation
1. University revokes fraudulent credential
2. Verifier checks revocation status on-chain
3. Verification fails for revoked credential

## 🔒 Security Features

- **Role-Based Access Control**: OpenZeppelin's AccessControl
- **Encryption**: AES-256 for off-chain data
- **HTTPS/TLS**: All API endpoints secured
- **Revocation Checks**: Mandatory before verification
- **Replay Attack Protection**: Nonce-based verification
- **GDPR Compliance**: Right-to-erasure via IPFS unpinning

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Sepolia), Polygon (Mumbai/Mainnet)
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **ZKP**: Circom, SnarkJS
- **Storage**: IPFS (Pinata)
- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, Next.js, TailwindCSS, ethers.js
- **DevOps**: Docker, GitHub Actions

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Smart Contract Specification](docs/CONTRACTS.md)
- [ZKP Circuit Design](docs/ZKP.md)
- [User Guide](docs/USER_GUIDE.md)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Circom & SnarkJS for ZKP infrastructure
- IPFS for decentralized storage
- Ethereum & Polygon communities

## 📞 Support

For issues and questions, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for a privacy-preserving employment verification future**


