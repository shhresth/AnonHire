# AnonHire — Comprehensive System Documentation

> **Employment Credential Verification System** using Self-Sovereign Identity (SSI), IPFS, Blockchain, and Zero-Knowledge Proofs.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Smart Contracts](#4-smart-contracts)
5. [Backend API Server](#5-backend-api-server)
6. [Frontend Application](#6-frontend-application)
7. [Zero-Knowledge Proof System](#7-zero-knowledge-proof-system)
8. [Database Schema](#8-database-schema)
9. [Security Model](#9-security-model)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [API Reference](#11-api-reference)
12. [Configuration & Environment](#12-configuration--environment)
13. [Deployment](#13-deployment)
14. [Glossary](#14-glossary)

---

## 1. System Overview

### 1.1 What is AnonHire?

AnonHire is a **decentralized employment credential verification platform** that enables:

- **Universities** to issue tamper-proof academic credentials (degree, GPA, major)
- **Employers** to issue verifiable job and internship credentials
- **Candidates** to store, manage, and selectively share their credentials
- **Verifiers** (recruiters, hiring managers) to verify credential authenticity **without** seeing sensitive details

The system uses **blockchain** for immutable credential anchoring, **IPFS** for decentralized encrypted data storage, and **Zero-Knowledge Proofs** for privacy-preserving verification (e.g., "GPA ≥ 3.5" without revealing the actual GPA).

### 1.2 Core Principles

| Principle | Implementation |
|---|---|
| **Privacy-First** | ZKPs allow selective disclosure; encrypted IPFS storage |
| **Decentralized** | Ethereum blockchain + IPFS — no single point of failure |
| **Tamper-Proof** | Cryptographic hashes on-chain ensure integrity |
| **Self-Sovereign** | Candidates own and control their credentials |
| **Auditable** | Every action is logged; blockchain provides immutable audit trail |

### 1.3 User Roles

| Role | Description | Key Actions |
|---|---|---|
| **University** | Academic institution | Issue academic credentials (degree, GPA, major) |
| **Employer** | Company / organization | Issue job and internship credentials |
| **Candidate** | Job seeker / employee | View, store, share credentials; generate ZKPs |
| **Verifier** | Recruiter / hiring manager | Verify credential authenticity; set verification parameters |
| **Admin** | System administrator | Manage roles, pause contracts, cleanup logs |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │  Home    │ │  Wallet  │ │ Issuer   │ │ Verifier │ │ Auth │ │
│  │  Page    │ │  Page    │ │ Pages    │ │  Page    │ │ Page │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ │
│       │             │            │             │          │     │
│  ┌────┴─────────────┴────────────┴─────────────┴──────────┴───┐ │
│  │              RainbowKit + wagmi (Wallet Connection)        │ │
│  │              Axios / fetch (API Client)                    │ │
│  └────────────────────────────┬────────────────────────────────┘ │
└───────────────────────────────┼──────────────────────────────────┘
                                │ HTTP (REST API)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                         │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────────┐│
│  │ Middleware  │  │  Controllers │  │       Services             ││
│  │ ─ auth.ts  │  │ ─ auth       │  │ ─ blockchain.service.ts    ││
│  │ ─ validate │  │ ─ credential │  │ ─ encryption.service.ts    ││
│  │ ─ error    │  │ ─ verify     │  │ ─ ipfs.service.ts          ││
│  │ ─ reqLog   │  │ ─ zkp        │  │ ─ zkp.service.ts           ││
│  │ ─ security │  │ ─ did        │  │ ─ audit.service.ts         ││
│  └────────────┘  └──────────────┘  └─────────────┬──────────────┘│
│                                                   │               │
│  ┌────────────────────────┐    ┌──────────────────┴─────────────┐│
│  │   Prisma ORM Client    │    │     ethers.js v6               ││
│  └───────────┬────────────┘    └──────────────┬─────────────────┘│
└──────────────┼────────────────────────────────┼──────────────────┘
               │                                │
               ▼                                ▼
    ┌──────────────────┐            ┌───────────────────────────┐
    │   PostgreSQL DB  │            │   Ethereum Sepolia        │
    │  (Docker)        │            │   ┌───────────────────┐   │
    │                  │            │   │VerifiableCredential│   │
    │  • User          │            │   │DIDRegistry         │   │
    │  • Credential    │            │   │RevocationRegistry  │   │
    │  • Verification  │            │   └───────────────────┘   │
    │  • AuditLog      │            └───────────────────────────┘
    │  • IPFSPin       │
    └──────────────────┘            ┌───────────────────────────┐
                                    │       IPFS (Pinata)       │
                                    │  Encrypted credential     │
                                    │  data stored as JSON      │
                                    └───────────────────────────┘

    ┌───────────────────────────────────────────────────────────┐
    │                    ZKP ENGINE (Circom)                     │
    │  ┌────────────────────┐  ┌────────────────────────────┐   │
    │  │ gpa_proof.circom   │  │ experience_proof.circom     │   │
    │  │ (Groth16, Poseidon)│  │ (Groth16, Poseidon)         │   │
    │  └────────┬───────────┘  └──────────────┬─────────────┘   │
    │           │  snarkjs                     │                 │
    │           ▼                              ▼                 │
    │  ┌─────────────┐                ┌──────────────┐          │
    │  │ .wasm .zkey │                │ .wasm .zkey  │          │
    │  │ vkey.json   │                │ vkey.json    │          │
    │  └─────────────┘                └──────────────┘          │
    └───────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction

```
  University/Employer         Candidate                Verifier
        │                        │                        │
        │  1. Issue Credential   │                        │
        │───────────────────────►│                        │
        │  (POST /credentials/*) │                        │
        │                        │                        │
        │        ┌───────────────┤                        │
        │        │ 2. Encrypt    │                        │
        │        │ 3. IPFS Upload│                        │
        │        │ 4. Blockchain │                        │
        │        │ 5. DB Store   │                        │
        │        └───────────────┤                        │
        │                        │                        │
        │                        │  6. Share (QR Code)    │
        │                        │───────────────────────►│
        │                        │  (credential hash)     │
        │                        │                        │
        │                        │           7. Verify    │
        │                        │◄───────────────────────│
        │                        │  (GET /verify/:hash)   │
        │                        │                        │
        │                        │  8. Generate ZKP       │
        │                        │  (POST /zkp/*/generate)│
        │                        │                        │
        │                        │  9. Submit ZKP         │
        │                        │───────────────────────►│
        │                        │                        │
        │                        │          10. Verify ZKP│
        │                        │  (POST /zkp/*/verify)  │
```

### 2.3 Monorepo Structure

```
AnonHire/
├── .env                          # Root environment variables (all modules read from here)
├── package.json                  # npm workspaces: [contracts, zkp, backend, frontend]
├── docker-compose.yml            # PostgreSQL, backend, frontend containers
│
├── contracts/                    # Solidity smart contracts (Hardhat)
│   ├── src/
│   │   ├── VerifiableCredential.sol   # Main credential contract
│   │   ├── DIDRegistry.sol            # Decentralized ID registry
│   │   └── RevocationRegistry.sol     # Credential revocation
│   ├── scripts/deploy.ts
│   ├── test/
│   └── hardhat.config.ts
│
├── backend/                      # Express.js REST API
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/env.ts              # dotenv loader (MUST be first import)
│   │   ├── index.ts                   # Express app entry point
│   │   ├── controllers/              # Request handlers
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Auth, validation, logging
│   │   ├── routes/                   # Route definitions
│   │   ├── utils/logger.ts           # Winston logging
│   │   └── types/                    # TypeScript declarations
│   └── logs/
│
├── frontend/                     # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.tsx                   # Landing page
│   │   ├── auth/page.tsx              # Login/register
│   │   ├── wallet/page.tsx            # Candidate credential wallet
│   │   ├── verifier/page.tsx          # Verification portal
│   │   ├── issuer/university/page.tsx # University issuer form
│   │   ├── issuer/employer/page.tsx   # Employer issuer form
│   │   └── revocation/page.tsx        # Revocation registry viewer
│   ├── components/                    # TopNav, Toast, Footer
│   ├── lib/api.ts                     # Axios API client
│   └── providers.tsx                  # RainbowKit + wagmi + React Query
│
├── zkp/                          # Zero-Knowledge Proof circuits
│   ├── circuits/
│   │   ├── gpa_proof.circom
│   │   └── experience_proof.circom
│   ├── scripts/
│   │   ├── setup-ptau.js
│   │   ├── compile-circuits.js
│   │   └── setup-keys.js
│   └── build/                    # Compiled outputs (.wasm, .zkey, vkey.json)
│
├── scripts/
│   ├── setup.sh                  # Full project setup
│   └── demo.ts                   # Demo workflow script
│
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    ├── SETUP.md
    └── USER_GUIDE.md
```

---

## 3. Technology Stack

### 3.1 Overview

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | 14.0.4 | SSR/CSR React framework |
| **Frontend** | RainbowKit | ^2.0.0 | Wallet connection UI |
| **Frontend** | wagmi | ^2.4.3 | React hooks for Ethereum |
| **Frontend** | ethers.js | ^6.9.2 | Ethereum library (signing) |
| **Frontend** | Tailwind CSS | ^3.4.1 | Utility-first CSS |
| **Frontend** | qrcode.react | ^4.2.0 | QR code generation for sharing |
| **Frontend** | react-hot-toast | ^2.4.1 | Toast notifications |
| **Frontend** | react-icons | ^5.0.1 | Icon library |
| **Backend** | Express.js | ^4.18.2 | HTTP server framework |
| **Backend** | TypeScript | ^5.3.3 | Type safety |
| **Backend** | Prisma | ^5.8.1 | ORM for PostgreSQL |
| **Backend** | ethers.js | ^6.9.2 | Blockchain interaction |
| **Backend** | jsonwebtoken | ^9.0.2 | JWT authentication |
| **Backend** | snarkjs | ^0.7.3 | ZKP proof generation/verification |
| **Backend** | circomlibjs | ^0.1.7 | Poseidon hash in JS |
| **Backend** | @pinata/sdk | ^2.1.0 | IPFS pinning service |
| **Backend** | winston | ^3.11.0 | Structured logging |
| **Backend** | helmet | ^7.1.0 | HTTP security headers |
| **Database** | PostgreSQL | 15 (Alpine) | Relational database |
| **Blockchain** | Solidity | 0.8.20 | Smart contract language |
| **Blockchain** | Hardhat | ^2.19.4 | Development environment |
| **Blockchain** | OpenZeppelin | ^5.0.1 | Contract libraries (AccessControl, Pausable) |
| **Blockchain** | Ethereum Sepolia | Testnet | Deployment network |
| **ZKP** | Circom | 2.2.x | Circuit language |
| **ZKP** | snarkjs | ^0.7.3 | Groth16 proof system |
| **ZKP** | circomlib | ^2.0.5 | Circuit primitives (Poseidon, comparators) |
| **Infra** | Docker Compose | 3.8 | Container orchestration |

### 3.2 Key Design Decisions

1. **ethers.js v6 (not v5)**: Modern ESM-compatible, used in both frontend (BrowserProvider) and backend (JsonRpcProvider, Wallet)
2. **Prisma (not TypeORM)**: Type-safe database client with excellent migration tooling
3. **Groth16 (not PLONK)**: Smaller proof sizes, faster verification; trusted setup is acceptable for this use case
4. **Poseidon Hash (not SHA-256)**: ZKP-friendly hash function with low constraint count
5. **Pinata (not Infura IPFS)**: Reliable pinning with CDN gateway
6. **AES-256-GCM**: Authenticated encryption for credential data at rest
7. **Next.js App Router (not Pages)**: Modern React patterns, server components support
8. **RainbowKit**: Best-in-class wallet connection UX

---

## 4. Smart Contracts

### 4.1 Contract Architecture

```
┌──────────────────────────────────────────────┐
│            VerifiableCredential.sol           │
│  ─────────────────────────────────────────── │
│  Roles: ADMIN, ISSUER, VERIFIER              │
│  Functions:                                   │
│    issueAcademicVC(subject, ipfs, exp)       │
│    issueJobVC(subject, ipfs, exp)            │
│    issueInternshipVC(subject, ipfs, exp)     │
│    revokeVC(hash, reason)                    │
│    verifyCredential(hash) → bool             │
│    getCredential(hash) → Credential          │
│    getSubjectCredentials(addr) → bytes32[]   │
│    getIssuerCredentials(addr) → bytes32[]    │
│    getStatistics() → (total, acad, job, int) │
│  ─────────────────────────────────────────── │
│  Inherits: AccessControl, Pausable           │
│  References:                                  │
│    ├── DIDRegistry (hasDID checks)           │
│    └── RevocationRegistry (revocation)       │
└──────────────┬───────────────┬───────────────┘
               │               │
               ▼               ▼
┌──────────────────┐   ┌──────────────────────┐
│  DIDRegistry.sol │   │ RevocationRegistry   │
│  ────────────── │   │ ────────────────────  │
│  registerDID()   │   │ revokeCredential()   │
│  registerIssuer()│   │ restoreCredential()  │
│  updateDID()     │   │ isRevoked()          │
│  deactivateDID() │   │ getRevocationRecord()│
│  resolveDID()    │   │ batchCheckRevocation()│
│  resolveAddress()│   │ getIssuerRevocations()│
│  hasDID()        │   │ getTotalRevocations() │
│  getTotalDIDs()  │   │                       │
│  AccessControl   │   │ AccessControl         │
│  Pausable        │   │ Pausable              │
└──────────────────┘   └───────────────────────┘
```

### 4.2 VerifiableCredential.sol — Detailed Breakdown

**File**: `contracts/src/VerifiableCredential.sol` (309 lines)

#### Roles (AccessControl)

```solidity
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
```

- `ADMIN_ROLE`: Can pause/unpause the contract
- `ISSUER_ROLE`: Can issue and revoke credentials (granted to university/employer wallets)
- `VERIFIER_ROLE`: Defined but not enforced for verification (verification is permissionless)

#### Credential Struct

```solidity
struct Credential {
    bytes32 credentialHash;       // keccak256 of (issuer, subject, ipfsHash, timestamp, type)
    CredentialType credentialType; // ACADEMIC | JOB | INTERNSHIP
    address issuer;               // Wallet address of the issuing entity
    address subject;              // Wallet address of the credential holder
    string ipfsHash;              // CID of encrypted data on IPFS
    uint256 issuedAt;             // block.timestamp when issued
    uint256 expiresAt;            // 0 = never expires
    bool isValid;                 // false after revocation
}
```

#### Credential Hash Generation

```solidity
bytes32 credentialHash = keccak256(
    abi.encodePacked(
        msg.sender,      // issuer address
        _subject,         // subject address
        _ipfsHash,        // IPFS CID
        block.timestamp,  // time of issuance
        _type             // ACADEMIC/JOB/INTERNSHIP
    )
);
```

This hash is **deterministic** for a given (issuer, subject, IPFS CID, timestamp, type) tuple. It serves as the global unique identifier for the credential.

#### Issue Flow (Internal)

The `_issueCredential` function performs these checks:

1. `_subject != address(0)` — valid subject address
2. `bytes(_ipfsHash).length > 0` — IPFS hash provided
3. `didRegistry.hasDID(msg.sender)` — **issuer must have a registered DID**
4. `didRegistry.hasDID(_subject)` — **subject must have a registered DID**
5. `!credentials[credentialHash].isValid` — no duplicate

Then stores the credential and emits `CredentialIssued`.

#### Verification Flow

```solidity
function verifyCredential(bytes32 _credentialHash) external returns (bool) {
    // 1. Check credential exists and is valid
    // 2. Check expiration (if expiresAt > 0 && now > expiresAt → false)
    // 3. Check revocation via RevocationRegistry
    // 4. Emit CredentialVerified event
    // 5. Return isValid
}
```

#### Revocation Flow

```solidity
function revokeVC(bytes32 _credentialHash, string memory _reason) external {
    // 1. Require ISSUER_ROLE
    // 2. Require credential.isValid
    // 3. Require credential.issuer == msg.sender (only original issuer)
    // 4. Set isValid = false
    // 5. Register in RevocationRegistry
    // 6. Emit CredentialRevoked
}
```

### 4.3 DIDRegistry.sol — Detailed Breakdown

**File**: `contracts/src/DIDRegistry.sol` (200 lines)

#### DID Document

```solidity
struct DIDDocument {
    string did;              // e.g., "did:ethr:0xabc..."
    address owner;           // Ethereum address
    string publicKeyPem;     // Public key in PEM format
    string serviceEndpoint;  // Service URL
    uint256 createdAt;
    uint256 updatedAt;
    bool isActive;
}
```

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `registerDID(did, pubKey, endpoint)` | Public | Self-register a DID. Caller = owner. |
| `registerIssuer(addr, did, pubKey, endpoint)` | ADMIN_ROLE | Register + grant ISSUER_ROLE in one call |
| `updateDID(pubKey, endpoint)` | Owner only | Update DID document |
| `deactivateDID()` | Owner only | Set `isActive = false` |
| `resolveDID(address)` | Public (view) | Get DID document for an address |
| `resolveAddress(did)` | Public (view) | Reverse lookup: DID string → address |
| `hasDID(address)` | Public (view) | Returns `true` if address has active DID |

#### Auto-DID Registration (Backend)

The backend's `BlockchainService.ensureDID()` auto-registers DIDs for addresses that don't have one. This is critical because the `VerifiableCredential._issueCredential()` requires both issuer and subject to have DIDs.

```
ensureDID(address):
  1. Call didContract.hasDID(address)
  2. If false → registerDID("did:ethr:<address>", auto-key, auto-endpoint)
  3. If "already registered" error → ignore (race condition)
```

### 4.4 RevocationRegistry.sol — Detailed Breakdown

**File**: `contracts/src/RevocationRegistry.sol` (160 lines)

#### Revocation Record

```solidity
struct RevocationRecord {
    bool isRevoked;
    uint256 revokedAt;
    address revokedBy;
    string reason;
}
```

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `revokeCredential(hash, reason)` | ISSUER_ROLE | Mark credential as revoked |
| `restoreCredential(hash)` | ADMIN_ROLE | Emergency restoration |
| `isRevoked(hash)` | Public (view) | Check revocation status |
| `getRevocationRecord(hash)` | Public (view) | Get full revocation details |
| `batchCheckRevocation(hashes)` | Public (view) | Batch revocation check |
| `getIssuerRevocations(addr)` | Public (view) | All revocations by an issuer |

### 4.5 Deployment

**Script**: `contracts/scripts/deploy.ts`

```
1. Deploy DIDRegistry
2. Deploy RevocationRegistry
3. Deploy VerifiableCredential(didRegistryAddr, revocationRegistryAddr)
4. Grant ISSUER_ROLE to VerifiableCredential in RevocationRegistry
   (so VC contract can call revokeCredential on RevocationRegistry)
```

**Deployed Addresses (Sepolia)**:
- DIDRegistry: `0x88d021d36d6cD534621fF89027A2075ED280b775`
- RevocationRegistry: `0x485d59D044243e6Efdc4acA209452DA020815b0D`
- VerifiableCredential: `0xd25382f3d149C86ACeC6c8CE14324CC97e3f4b0f`

**Hardhat Config**: Solidity 0.8.20, optimizer enabled (200 runs), supports Sepolia/Mumbai/Polygon networks.

---

## 5. Backend API Server

### 5.1 Application Bootstrap

**Entry point**: `backend/src/index.ts`

```
1. import './config/env'           ← MUST be first import (loads .env)
2. import express, cors, helmet, morgan, etc.
3. Configure middleware stack:
   ├── helmet()                    ← Security headers
   ├── cors({ origin: CORS_ORIGIN })
   ├── express.json({ limit: '10mb' })
   ├── securityLogger             ← Suspicious pattern detection
   ├── requestLogger              ← Performance metrics + audit
   └── morgan('combined')         ← HTTP request logging
4. Mount routes at /api/v1
5. Mount errorHandler
6. Listen on PORT (default: 3001)
```

**Critical**: The `config/env.ts` file must be the first import because services like `EncryptionService` and `BlockchainService` read `process.env` at module load time.

```typescript
// backend/src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

### 5.2 Middleware Stack

#### Authentication (`middleware/auth.ts`)

| Export | Type | Description |
|---|---|---|
| `authenticate` | Middleware | Extracts JWT from `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, loads user from DB, attaches to `req.user` |
| `authorize(roles)` | Factory | Returns middleware that checks `req.user.role` against allowed roles |
| `generateToken(user)` | Utility | Creates JWT with `{ userId, address, role }`, expires in `JWT_EXPIRES_IN` (default: 7d) |

**JWT Payload**:
```json
{
  "userId": "uuid",
  "address": "0x...",
  "role": "UNIVERSITY"
}
```

#### Bypass Auth (`credential.routes.ts` — testing only)

For development/testing, the credential issuance routes use `bypassAuth` instead of `authenticate`:

```typescript
const bypassAuth = async (req, _res, next) => {
  const rawAddress = req.body?.issuerAddress || req.body?.subjectAddress || '0x000...001';
  const address = rawAddress.toLowerCase();  // ← normalize to prevent duplicates
  let user = await prisma.user.findUnique({ where: { address } });
  if (!user) user = await prisma.user.create({ data: { address, role: 'ADMIN' } });
  req.user = user;
  next();
};
```

> ⚠️ **TODO**: Remove `bypassAuth` before production deployment.

#### Validation (`middleware/validate.ts`)

Uses `express-validator`. The `validate` middleware checks `validationResult(req)` and returns 400 with error details if validation fails.

#### Error Handler (`middleware/errorHandler.ts`)

Catches all errors and normalizes responses:
- Prisma `P2002` → 409 Conflict
- Prisma `P2025` → 404 Not Found
- JWT errors → 401 Unauthorized
- Default → 500 Internal Server Error
- Stack traces included in development mode only

#### Request Logger (`middleware/requestLogger.ts`)

Two middleware functions:

1. **`requestLogger`**: Wraps `res.send()` to measure response time. Logs HTTP requests via `logRequest()`, security events for 4xx/5xx, and audit events for non-GET API calls.

2. **`securityLogger`**: Scans URL and User-Agent for suspicious patterns (directory traversal, XSS, SQL injection, code injection). Implements basic in-memory rate limiting (100 requests per 15 minutes per IP).

### 5.3 Services

#### BlockchainService (`services/blockchain.service.ts`)

**Constructor**:
```
1. Read SEPOLIA_RPC_URL → create JsonRpcProvider
2. Read PRIVATE_KEY → create Wallet (signer)
3. Read CONTRACT_* addresses → create Contract instances
4. Load ABIs from contracts/artifacts/ (compiled by Hardhat)
```

If any config is missing, the service degrades gracefully (logs warnings, returns null/false for read operations, throws for write operations).

**Key Methods**:

| Method | Description |
|---|---|
| `issueAcademicVC(subject, ipfsHash, expiresAt)` | Calls `ensureDID()` for both parties, then `vcContract.issueAcademicVC()` |
| `issueJobVC(...)` | Same pattern for job credentials |
| `issueInternshipVC(...)` | Same pattern for internship credentials |
| `revokeVC(hash, reason)` | Calls `vcContract.revokeVC()` |
| `verifyCredential(hash)` | Calls `vcContract.verifyCredential()`, parses `CredentialVerified` event |
| `registerDID(did, pubKey, endpoint)` | Calls `didContract.registerDID()` |
| `resolveDID(address)` | Calls `didContract.resolveDID()` |
| `isRevoked(hash)` | Calls `revocationContract.isRevoked()` |
| `getCredential(hash)` | Calls `vcContract.getCredential()` |
| `getStatistics()` | Calls `vcContract.getStatistics()` |
| `ensureDID(address)` | Private: checks `hasDID()`, auto-registers if missing |

**Gas Limits**: Write operations use explicit gas limits:
- Credential issuance: `500,000`
- Revocation: `300,000`
- DID registration: `300,000`

#### EncryptionService (`services/encryption.service.ts`)

**Algorithm**: AES-256-GCM (authenticated encryption)

**Key Derivation**:
```
AES_SECRET_KEY (from .env) → SHA-256 hash → 32-byte key
```

**Encrypt**:
```
1. Generate random 16-byte IV
2. Create AES-256-GCM cipher with key + IV
3. Encrypt plaintext → ciphertext
4. Get authentication tag
5. Return JSON string: { iv, encryptedData, authTag } (all hex-encoded)
```

**Decrypt**:
```
1. Parse JSON string → { iv, encryptedData, authTag }
2. Create decipher with key + IV
3. Set auth tag
4. Decrypt ciphertext → plaintext
```

The auth tag prevents tampering. If anyone modifies the ciphertext, decryption will fail.

#### IPFSService (`services/ipfs.service.ts`)

Uses **Pinata SDK** for IPFS pinning.

| Method | Description |
|---|---|
| `uploadJSON(data)` | Pins JSON to IPFS via Pinata, saves `IPFSPin` record in DB, returns CID |
| `getJSON(ipfsHash)` | Fetches from Pinata gateway (`https://gateway.pinata.cloud/ipfs/<hash>`) |
| `unpin(ipfsHash)` | Removes pin (for GDPR compliance), updates DB |
| `isPinned(ipfsHash)` | Checks pin status via Pinata API |
| `getAllPins()` | Lists all pinned content |

**Pinata Options**:
- Metadata name: `credential-<timestamp>`
- CID version: 1

#### ZKPService (`services/zkp.service.ts`)

**Dependencies**: `snarkjs`, `circomlibjs` (for Poseidon hash)

| Method | Description |
|---|---|
| `generateGPAProof(gpa, threshold, credentialHash)` | Generates Groth16 proof that GPA ≥ threshold |
| `verifyGPAProof(proof, publicSignals)` | Verifies a GPA proof using verification key |
| `generateExperienceProof(months, required, credHash)` | Generates proof that experience ≥ required |
| `verifyExperienceProof(proof, publicSignals)` | Verifies an experience proof |
| `generateCommitment(value, salt, credHash)` | Computes Poseidon(value, salt, credHash) |
| `generateSalt()` | Generates cryptographically random 32-byte BigInt |

**GPA Proof Generation (detailed)**:
```
1. Scale GPA: gpa × 100 → integer (e.g., 3.75 → 375)
2. Scale threshold: threshold × 100
3. Generate random salt (32 bytes → BigInt)
4. Convert credentialHash: hex string → BigInt
5. Build Poseidon commitment: Poseidon(scaledGpa, salt, credHashBigInt)
6. Prepare circuit inputs:
   {
     gpa: scaledGpa,
     salt: salt,
     credentialHash: credHashBigInt,
     threshold: scaledThreshold,
     expectedCommitment: commitment
   }
7. Call snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath)
8. Return { proof, publicSignals, commitment, salt }
```

**File Paths for ZKP**:
- WASM: `zkp/build/<circuit>/<circuit>_js/<circuit>.wasm`
- ZKEY: `zkp/build/<circuit>/<circuit>_final.zkey`
- VKEY: `zkp/build/<circuit>/verification_key.json`

#### AuditService (`services/audit.service.ts`)

Wraps Prisma `AuditLog` operations:

| Method | Description |
|---|---|
| `log(data)` | Create audit log entry (never throws — fire-and-forget) |
| `getUserLogs(userId, limit)` | Get logs for a specific user |
| `getActionLogs(action, limit)` | Get logs by action type |
| `getResourceLogs(resource, limit)` | Get logs by resource |
| `getRecentLogs(limit)` | Get recent logs with user details |
| `cleanupOldLogs(daysToKeep)` | Delete logs older than N days (default: 90) |

### 5.4 Controllers

#### Auth Controller (`controllers/auth.controller.ts`)

**`getNonce(GET /auth/nonce/:address)`**:
```
1. Generate random 32-byte hex nonce
2. Store in in-memory Map with 5-minute TTL
3. Return { nonce }
```

**`login(POST /auth/login)`**:
```
1. Validate: { address, signature, message }
2. Verify ECDSA signature: ethers.verifyMessage(message, signature)
3. Check recovered address matches claimed address (case-insensitive)
4. Verify nonce exists and hasn't expired
5. Find or create user in DB (normalized lowercase address)
6. Generate JWT token
7. Return { token, user: { id, address, role } }
```

**`register(POST /auth/register)`**:
```
1. Validate: { address, role, email? }
2. Check user doesn't already exist
3. Create user in DB
4. Return { user: { id, address, role } }
```

#### Credential Controller (`controllers/credential.controller.ts`)

This is the largest controller (662 lines). It handles all credential CRUD operations.

**`issueAcademicCredential(POST /credentials/academic)`**:
```
1. Extract from body: subjectAddress, studentName, degree, major, gpa,
   graduationYear, institutionName, expiresAt?
2. Find or create subject user (by address, normalized lowercase)
3. Build credential data object:
   {
     type: "ACADEMIC",
     issuer: { address, name: institutionName },
     subject: { address: subjectAddress, name: studentName },
     claims: { degree, major, gpa, graduationYear },
     issuedAt: new Date().toISOString(),
     expiresAt: ...
   }
4. Encrypt credential data → encryptedData (AES-256-GCM)
5. Build IPFS payload:
   {
     type: "ACADEMIC",
     issuerAddress: ...,
     subjectAddress: ...,
     issuedAt: ...,
     encryptedData: ...
   }
6. Upload to IPFS → ipfsHash (CID)
7. Try blockchain: blockchainService.issueAcademicVC(subject, ipfsHash, expiresAt)
   → txHash (or null if blockchain fails — wrapped in try/catch)
8. Generate local credentialHash:
   ethers.keccak256(ethers.toUtf8Bytes(issuer + subject + ipfsHash + timestamp))
9. Save to DB: Credential { credentialHash, type, issuerId, subjectId,
   ipfsHash, encryptedData, txHash, issuedAt, expiresAt }
10. Audit log: "CREDENTIAL_ISSUED"
11. Return { credentialHash, ipfsHash, txHash, credentialId }
```

> **Note**: Steps 7-8 are slightly nuanced. If blockchain succeeds, the on-chain hash may differ from the local hash. The local hash is used as the primary identifier in the DB.

**`issueJobCredential`** and **`issueInternshipCredential`** follow the same pattern with different field names.

**`getDecryptedCredential(GET /credentials/:id/decrypted)`**:
```
1. Authenticate user
2. Find credential by ID
3. Ownership check:
   a. Check req.user.id matches credential.subjectId
   b. If not, fallback: find user by normalized address, check if subject
4. Decrypt encryptedData using EncryptionService
5. Return decrypted credential details
```

The fallback address-based check handles the case where a user has duplicate records due to address casing mismatches.

**`verifyByHash` / `revokeCredential` / `getSubjectCredentials` / `getIssuerCredentials`** follow standard CRUD patterns with appropriate access controls.

#### Verification Controller (`controllers/verification.controller.ts`)

**`verifyCredential(POST /verification/verify)`**:
```
1. Extract credentialHash (and optional verificationParams)
2. Find credential in DB by hash
3. Check revocation: DB field isRevoked + blockchain isRevoked()
4. If verificationParams provided → validateCredentialParameters()
5. Log verification to DB (Verification table; verifierId is stored when a valid bearer token is provided)
6. Return { isValid, credential, isRevokedDb, isRevokedOnChain, parameterValidation? }
```

**`validateCredentialParameters(credentialHash, params)`**:
```
For each parameter provided:
  - minGpa: fetch IPFS data, compare gpa ≥ minGpa
  - requiredDegree: compare degree string (case-insensitive, includes check)
  - requiredMajor: compare major string (case-insensitive, includes check)
  - minGraduationYear: compare graduationYear ≥ minGraduationYear
  - minExperience: compare experienceMonths ≥ minExperience
  - requiredSkills: check each required skill exists in credential's skills array

Returns:
  {
    isValid: boolean,        // all checks passed
    summary: string,         // "All N checks passed" or "M of N checks failed"
    results: [               // individual check results
      { parameter, isValid, required, actual, message }
    ]
  }
```

**`verifyByHash(GET /verification/verify/:credentialHash)`**:
Public endpoint (no auth required) that returns basic verification info plus public summary.

#### ZKP Controller (`controllers/zkp.controller.ts`)

**`generateGPAProof(POST /zkp/gpa/generate)`**:
```
1. Extract { gpa, threshold, credentialHash }
2. Call zkpService.generateGPAProof(gpa, threshold, credentialHash)
3. Return { proof, publicSignals, commitment, salt }
```

**`verifyGPAProof(POST /zkp/gpa/verify)`**:
```
1. Extract { proof, publicSignals }
2. Call zkpService.verifyGPAProof(proof, publicSignals)
3. Log to DB
4. Return { isValid }
```

Same pattern for `generateExperienceProof` and `verifyExperienceProof`.

#### DID Controller (`controllers/did.controller.ts`)

**`registerDID(POST /did/register)`**:
```
1. Extract { did, publicKeyPem, serviceEndpoint }
2. Check user doesn't already have a DID
3. Call blockchainService.registerDID(did, pubKey, endpoint)
4. Update user.did in DB
5. Return { did, txHash }
```

**`resolveDID(GET /did/:address)`**:
Public endpoint that calls `blockchainService.resolveDID(address)`.

### 5.5 Routes

| Route File | Prefix | Description |
|---|---|---|
| `auth.routes.ts` | `/api/v1/auth` | Login, register, nonce |
| `credential.routes.ts` | `/api/v1/credentials` | CRUD + issuance + revocation |
| `verification.routes.ts` | `/api/v1/verification` | Verify, verify-with-params, verify-by-hash |
| `zkp.routes.ts` | `/api/v1/zkp` | Generate/verify GPA and experience proofs |
| `did.routes.ts` | `/api/v1/did` | Register and resolve DIDs |
| `mock-zkp.routes.ts` | `/api/v1/zkp` | Mock ZKP for testing (overrides some endpoints) |

### 5.6 Logging System

**Winston** with multiple transports:

| Transport | File | Level | Max Size | Max Files |
|---|---|---|---|---|
| Error log | `logs/error.log` | error | 5MB | 5 |
| Combined log | `logs/combined.log` | all | 5MB | 5 |
| Audit log | `logs/audit.log` | info | 10MB | 10 |
| Security log | `logs/security.log` | warn | 5MB | 5 |
| Console | stdout | all | — | — (dev only) |

**Specialized Loggers**:
- `logger` — General application logger
- `auditLogger` — Audit events (credential issuance, verification, etc.)
- `securityLogger` — Security events (suspicious patterns, rate limits)

**Helper Functions**: `logAudit()`, `logSecurity()`, `logPerformance()`, `logError()`, `logRequest()`

---

## 6. Frontend Application

### 6.1 Application Structure

**Framework**: Next.js 14 with App Router (all pages are `'use client'`)

**Provider Hierarchy**:
```
<html>
  <body>
    <ToastProvider>           ← Custom toast context
      <WagmiProvider>         ← Ethereum state management
        <QueryClientProvider> ← React Query for caching
          <RainbowKitProvider>← Wallet connection UI
            {children}
            <Footer />
            <Toaster />       ← react-hot-toast
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ToastProvider>
  </body>
</html>
```

**Wallet Configuration**:
```typescript
const config = getDefaultConfig({
  appName: 'AnonHire',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [sepolia, polygonMumbai],
  transports: {
    [sepolia.id]: http(NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [polygonMumbai.id]: http(NEXT_PUBLIC_POLYGON_MUMBAI_RPC_URL),
  },
});
```

### 6.2 Pages

#### Landing Page (`app/page.tsx`)

- Hero section with tagline and CTA buttons
- Feature cards (Privacy, Security, Academic, Work, Decentralized, Tamper-Proof)
- "How It Works" 3-step process
- Role selection cards (University, Employer, Candidate, Verifier)
- Platform statistics
- Full footer with navigation links

#### Auth Page (`app/auth/page.tsx`)

- Wallet connection status indicator
- Login flow: getNonce → signMessage → POST /auth/login → store JWT
- Registration form: email, role selector (Candidate/University/Employer/Verifier)
- Auto-register on 404 during login attempt
- Post-auth redirect based on role

#### Wallet Page (`app/wallet/page.tsx` — 1141 lines)

The most complex frontend page. Contains:

**Main Component** (`WalletPage`):
- Wallet connection check (shows "Connect Your Wallet" if disconnected)
- Address input for viewing any address's credentials
- Credential list fetched from `/api/v1/credentials/subject/:address`
- Action cards: Generate ZKP, Share Credential, View History

**Sub-Components**:

| Component | Purpose |
|---|---|
| `CredentialCard` | Gradient card displaying credential type, status, hashes (truncated), copy buttons |
| `AddCredentialModal` | Form to add local credential (type, issuer, date) — local-only, not on-chain |
| `ZKPModal` | Select credential → choose proof type (GPA/experience) → set threshold → generate |
| `ShareModal` | QR code generation using `QRCodeSVG`. URL format: `<origin>/verifier?hash=<credentialHash>`. Download QR as PNG. Copy link. |
| `HistoryModal` | Static verification history display |
| `ViewCredentialModal` | Fetches decrypted credential from `/credentials/:id/decrypted` (owner only). Renders type-specific fields. |

**Authentication Flow** (`ensureBackendAuth`):
```
1. Check localStorage for existing token
2. If none: request MetaMask accounts
3. GET /auth/nonce/<address> → nonce
4. Sign message: "Sign this message to login. Nonce: <nonce>"
5. POST /auth/login → JWT token
6. Store token + address in localStorage
```

#### Verifier Page (`app/verifier/page.tsx` — 701 lines)

**Features**:
- Auto-fill credential hash from URL query param (`?hash=<hash>`)
- "Pre-filled from QR" badge when hash comes from QR scan
- "Paste QR Link" button: reads clipboard, extracts hash from URL or raw `0x...`
- Advanced verification parameters panel:
  - Academic: Min GPA, required degree, required major, min graduation year
  - Professional: Min experience (months), required skills (tag input)
- Verification history (in-memory, last 10)
- Result display: status banner, parameter validation results, credential details, blockchain info (with Etherscan/IPFS links)

**Verification Flow**:
```
Basic:  GET /api/v1/verification/verify/:credentialHash
With params: POST /api/v1/verification/verify-with-params
  body: { credentialHash, verificationParams: { minGpa, requiredDegree, ... } }
```

#### University Issuer Page (`app/issuer/university/page.tsx`)

Form fields: Student Wallet Address, Student Name, Degree (dropdown), Major, GPA, Graduation Year, University Name.

Auto-authenticates via `ensureBackendAuth()`, auto-registers as UNIVERSITY role if needed.

Submits to `POST /api/v1/credentials/academic`.

#### Employer Issuer Page (`app/issuer/employer/page.tsx`)

Form fields: Employee Wallet Address, Employee Name, Position, Company Name, Start Date, End Date, Currently Employed checkbox, Job Description.

Submits to `POST /api/v1/credentials/job`.

#### Revocation Page (`app/revocation/page.tsx`)

Displays revoked credentials in a table with:
- Stats cards (total, by type)
- Search by hash/issuer/subject/reason
- Filter by type
- Table with: hash, type, issuer, subject, revoked at, reason, copy actions

### 6.3 Components

| Component | File | Description |
|---|---|---|
| `TopNav` | `components/TopNav.tsx` | Sticky header with back arrow, title, ConnectButton. Accent color prop (blue/green). |
| `Toast` | `components/Toast.tsx` | Context-based toast system. Provider + `useToast()` hook. Auto-dismiss after 2.5s. |
| `Footer` | `components/Footer.tsx` | Simple footer with copyright and doc/support links. |

### 6.4 API Client (`lib/api.ts`)

Axios-based client with:
- Base URL: `NEXT_PUBLIC_API_URL/api/v1`
- Auto-attach `authToken` from localStorage via interceptor
- Typed API objects: `authAPI`, `credentialsAPI`, `zkpAPI`, `verificationAPI`, `didAPI`

---

## 7. Zero-Knowledge Proof System

### 7.1 Overview

The ZKP system enables **privacy-preserving verification** of credential claims. Instead of revealing actual values (e.g., GPA = 3.75), a candidate can prove a statement (e.g., "GPA ≥ 3.5") without disclosing the underlying data.

```
  Candidate                          Verifier
     │                                  │
     │  "I have GPA ≥ 3.5"             │
     │  (actual GPA = 3.75, hidden)     │
     │                                  │
     │  Generate Groth16 proof:          │
     │  Inputs:                          │
     │    private: gpa=375, salt, hash  │
     │    public: threshold=350,         │
     │            commitment             │
     │                                  │
     │  ──── proof + publicSignals ───► │
     │                                  │
     │                 Verify proof:     │
     │                 1. Check proof    │
     │                    against vkey   │
     │                 2. Check valid=1  │
     │                 3. Check          │
     │                    commitment     │
     │                                  │
     │  ◄──── { isValid: true } ─────  │
     │                                  │
     │  Verifier learns: GPA ≥ 3.5     │
     │  Verifier does NOT learn:        │
     │    actual GPA, transcript, etc.  │
```

### 7.2 Circuit Design

#### GPA Proof Circuit (`gpa_proof.circom`)

```
Template: GPAProof()

Private Inputs:
  - gpa (scaled ×100, e.g., 3.75 → 375)
  - salt (random BigInt)
  - credentialHash (BigInt from hex)

Public Inputs:
  - threshold (scaled ×100, e.g., 3.5 → 350)
  - expectedCommitment (Poseidon hash)

Output:
  - valid (1 if gpa ≥ threshold, 0 otherwise)

Constraints:
  1. gpa ≤ 400 (max 4.0 GPA)          ← LessEqThan(32)
  2. gpa ≥ 0                           ← GreaterEqThan(32)
  3. valid = (gpa ≥ threshold)          ← GreaterEqThan(32)
  4. Poseidon(gpa, salt, credHash) === expectedCommitment

Total constraints: ~50
```

#### Experience Proof Circuit (`experience_proof.circom`)

```
Template: ExperienceProof()

Private Inputs:
  - experienceMonths
  - salt
  - credentialHash

Public Inputs:
  - requiredMonths
  - expectedCommitment

Output:
  - valid (1 if experienceMonths ≥ requiredMonths, 0 otherwise)

Constraints:
  1. experienceMonths ≤ 600 (max 50 years)
  2. experienceMonths ≥ 0
  3. valid = (experienceMonths ≥ requiredMonths)
  4. Poseidon(experienceMonths, salt, credHash) === expectedCommitment

Total constraints: ~50
```

### 7.3 Cryptographic Components

#### Poseidon Hash

A ZKP-friendly hash function from the `circomlib` library. Unlike SHA-256 (which requires ~25,000 constraints in a circuit), Poseidon requires only ~200 constraints.

Used for:
- **Commitment**: Poseidon(value, salt, credentialHash) — binds the proof to a specific credential
- **Hiding**: The salt prevents the verifier from brute-forcing the actual value

#### Groth16

A zkSNARK proving system that produces:
- **Proof**: ~128 bytes (3 elliptic curve points)
- **Public signals**: Array of field elements (threshold, commitment, valid)
- **Verification**: ~1ms (much faster than proof generation)

Properties:
- **Zero-knowledge**: Verifier learns nothing beyond the statement
- **Succinctness**: Proof is constant size regardless of computation
- **Non-interactive**: No back-and-forth between prover and verifier
- **Requires trusted setup**: The Powers of Tau ceremony + circuit-specific setup

### 7.4 Build Pipeline

```
Step 1: Download Powers of Tau
  npm run setup:ptau
  ↓
  Hermez ptau file (50MB) → zkp/build/powersOfTau28_hez_final_12.ptau
  (Mirror: storage.googleapis.com/zkevm/ptau/)

Step 2: Compile Circuits
  npm run compile
  ↓
  circom2 <circuit>.circom --r1cs --wasm --sym -o build/<circuit>/ -l ../node_modules
  ↓
  Outputs per circuit:
    <circuit>.r1cs            (constraint system)
    <circuit>_js/<circuit>.wasm  (witness generator)
    <circuit>.sym             (symbol table)

Step 3: Generate Keys
  npm run setup:keys
  ↓
  For each circuit:
    1. snarkjs groth16 setup <r1cs> <ptau> → initial zkey
    2. snarkjs zkey contribute → contributed zkey
    3. snarkjs zkey beacon → final zkey
    4. snarkjs zkey export verificationkey → verification_key.json
  ↓
  Outputs per circuit:
    <circuit>_final.zkey      (proving key, ~5MB)
    verification_key.json     (verification key, ~2KB)
```

### 7.5 Runtime Flow (Backend)

```
Generate Proof:
  1. Frontend calls POST /api/v1/zkp/gpa/generate
     Body: { gpa: 3.75, threshold: 3.5, credentialHash: "0x..." }

  2. ZKPService.generateGPAProof():
     a. Scale: gpa=375, threshold=350
     b. Generate salt: crypto.randomBytes(32) → BigInt
     c. Convert credentialHash to BigInt
     d. Compute commitment: Poseidon(375, salt, credHashBigInt)
     e. Call snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath)
     f. Return { proof, publicSignals, commitment, salt }

  3. Response: { proof: {...}, publicSignals: [...], commitment: "...", salt: "..." }

Verify Proof:
  1. Frontend calls POST /api/v1/zkp/gpa/verify
     Body: { proof: {...}, publicSignals: [...] }

  2. ZKPService.verifyGPAProof():
     a. Load verification_key.json
     b. Call snarkjs.groth16.verify(vkey, publicSignals, proof)
     c. Return boolean

  3. Response: { isValid: true }
```

---

## 8. Database Schema

### 8.1 Entity-Relationship Diagram

```
┌─────────────────────┐
│       User          │
├─────────────────────┤
│ id         UUID  PK │
│ address    String UQ │──────────────┐
│ did        String UQ │              │
│ email      String UQ │              │
│ role       UserRole  │              │
│ createdAt  DateTime  │              │
│ updatedAt  DateTime  │              │
├─────────────────────┤              │
│ ← issuedCredentials │              │
│ ← receivedCredentials│             │
│ ← verifications     │              │
│ ← auditLogs         │              │
└──────────┬──────────┘              │
           │ 1:N                     │ 1:N
           ▼                         ▼
┌──────────────────────────────────────────────┐
│              Credential                       │
├──────────────────────────────────────────────┤
│ id               UUID       PK               │
│ credentialHash   String     UQ               │
│ credentialType   CredentialType              │
│ issuerId         String     FK → User.id     │
│ subjectId        String     FK → User.id     │
│ ipfsHash         String                       │
│ encryptedData    Text       (AES-256-GCM)    │
│ issuedAt         DateTime                     │
│ expiresAt        DateTime?                    │
│ isRevoked        Boolean    default: false    │
│ revokedAt        DateTime?                    │
│ revocationReason String?                      │
│ txHash           String?    UQ               │
│ createdAt        DateTime                     │
│ updatedAt        DateTime                     │
├──────────────────────────────────────────────┤
│ ← verifications                               │
└───────────────┬──────────────────────────────┘
                │ 1:N
                ▼
┌────────────────────────────────────────┐
│           Verification                  │
├────────────────────────────────────────┤
│ id             UUID    PK              │
│ credentialId   String  FK → Credential │
│ verifierId     String  FK → User       │
│ isValid        Boolean                 │
│ verifiedAt     DateTime                │
│ proofType      String?                 │
│ proofData      Text?                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│            AuditLog                     │
├────────────────────────────────────────┤
│ id          UUID      PK              │
│ userId      String    FK → User       │
│ action      String                     │
│ resource    String                     │
│ details     Text?                      │
│ ipAddress   String?                    │
│ userAgent   String?                    │
│ timestamp   DateTime                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│             IPFSPin                     │
├────────────────────────────────────────┤
│ id          UUID      PK              │
│ ipfsHash    String    UQ              │
│ pinataId    String?                    │
│ fileName    String                     │
│ fileSize    Int                        │
│ isPinned    Boolean   default: true   │
│ createdAt   DateTime                   │
│ unpinnedAt  DateTime?                  │
└────────────────────────────────────────┘
```

### 8.2 Enums

**UserRole**: `ADMIN | UNIVERSITY | EMPLOYER | INTERNSHIP_PROVIDER | CANDIDATE | VERIFIER`

**CredentialType**: `ACADEMIC | JOB | INTERNSHIP`

### 8.3 Indexes

| Table | Index | Purpose |
|---|---|---|
| User | `address` | Fast lookup by wallet address |
| User | `did` | Fast DID resolution |
| Credential | `credentialHash` | Primary lookup for verification |
| Credential | `issuerId` | List credentials by issuer |
| Credential | `subjectId` | List credentials by subject |
| Credential | `credentialType` | Filter by type |
| Verification | `credentialId` | List verifications per credential |
| Verification | `verifierId` | List verifications by verifier |
| AuditLog | `userId` | User activity lookup |
| AuditLog | `action` | Action-based filtering |
| AuditLog | `timestamp` | Time-range queries |
| IPFSPin | `ipfsHash` | CID lookup |
| IPFSPin | `isPinned` | Active pin filtering |

---

## 9. Security Model

### 9.1 Authentication

```
┌─────────────┐     1. GET /auth/nonce/:address     ┌──────────┐
│  Frontend    │────────────────────────────────────►│  Backend │
│  (Browser)   │◄────────────────────────────────────│          │
│              │     { nonce: "abc123..." }           │          │
│              │                                      │          │
│  MetaMask    │     2. Sign message with private key │          │
│  ┌────────┐  │     "Sign this message... Nonce: X"  │          │
│  │ Private │  │                                      │          │
│  │  Key    │  │                                      │          │
│  └────────┘  │     3. POST /auth/login              │          │
│              │     { address, signature, message }   │          │
│              │────────────────────────────────────►│          │
│              │                                      │ Verify:  │
│              │                                      │ ecrecover│
│              │◄────────────────────────────────────│ → JWT    │
│              │     { token: "eyJ..." }              │          │
└─────────────┘                                      └──────────┘
```

**Key Points**:
- No passwords — wallet signature is the authentication factor
- Nonce prevents replay attacks (5-minute TTL, single-use)
- JWT issued after successful verification
- JWT expires after 7 days (configurable via `JWT_EXPIRES_IN`)

### 9.2 Authorization

| Endpoint | Required Role | Middleware |
|---|---|---|
| `POST /credentials/academic` | UNIVERSITY, ADMIN | `bypassAuth` (dev) / `authenticate + authorize` (prod) |
| `POST /credentials/job` | EMPLOYER, ADMIN | Same |
| `POST /credentials/internship` | EMPLOYER, INTERNSHIP_PROVIDER, ADMIN | Same |
| `POST /credentials/:id/revoke` | Issuer (checked in controller) | `authenticate` |
| `GET /credentials/:id/decrypted` | Subject only | `authenticate` + ownership check |
| `POST /zkp/*/generate` | Any authenticated | `authenticate` |
| `POST /zkp/*/verify` | Any authenticated | `authenticate` |
| `POST /verification/verify` | Any authenticated | `authenticate` |
| `GET /verification/verify/:hash` | Public | None |
| `POST /verification/verify-with-params` | Public | None |

### 9.3 Encryption at Rest

| Data | Encryption | Location |
|---|---|---|
| Credential claims (GPA, degree, etc.) | AES-256-GCM | IPFS (encrypted JSON), PostgreSQL (encryptedData field) |
| IPFS payload | Contains encrypted data | Pinata gateway |
| Database credentials | PostgreSQL auth | Docker volume |
| Private keys | Not stored on server | `.env` file only |

### 9.4 On-Chain Security

| Contract | Security Feature |
|---|---|
| All contracts | **AccessControl** (role-based permissions) |
| All contracts | **Pausable** (emergency circuit breaker) |
| VerifiableCredential | `onlyRole(ISSUER_ROLE)` for issuance |
| VerifiableCredential | Issuer-only revocation check |
| VerifiableCredential | DID requirement for both parties |
| RevocationRegistry | Only ISSUER_ROLE can revoke |
| RevocationRegistry | Only ADMIN_ROLE can restore |
| DIDRegistry | Self-registration (no admin needed for basic DID) |

### 9.5 Security Middleware

1. **Helmet**: Sets security headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
2. **CORS**: Restricted to `CORS_ORIGIN` (default: `http://localhost:3000`)
3. **Request Logging**: All non-GET API calls are audit-logged
4. **Suspicious Pattern Detection**: Regex checks for directory traversal, XSS, SQL injection, code injection
5. **Rate Limiting**: Basic in-memory rate limit (100 requests / 15 minutes per IP)
6. **Input Validation**: `express-validator` on all routes

### 9.6 ZKP Security Properties

| Property | Guarantee |
|---|---|
| **Soundness** | A proof for a false statement will be rejected (except with negligible probability) |
| **Zero-Knowledge** | The verifier learns nothing beyond the truth of the statement |
| **Commitment Binding** | The Poseidon commitment binds the proof to a specific credential and salt |
| **Salt** | Prevents brute-force attacks on small value spaces (e.g., GPA has only ~400 possible values) |
| **Credential Hash** | Links the proof to a specific on-chain credential |

---

## 10. Data Flow Diagrams

### 10.1 Credential Issuance (Full Flow)

```
University/Employer                    Backend                         IPFS          Blockchain
        │                                │                              │               │
        │  POST /credentials/academic    │                              │               │
        │  {subjectAddress, studentName, │                              │               │
        │   degree, major, gpa, year,    │                              │               │
        │   institutionName}             │                              │               │
        │───────────────────────────────►│                              │               │
        │                                │                              │               │
        │                         1. Find/create subject user           │               │
        │                         2. Build credential data object       │               │
        │                         3. Encrypt with AES-256-GCM          │               │
        │                                │                              │               │
        │                         4. Upload to IPFS ──────────────────►│               │
        │                                │◄── ipfsHash (CID) ──────────│               │
        │                                │                              │               │
        │                         5. ensureDID(issuer) ────────────────────────────────►│
        │                            ensureDID(subject) ───────────────────────────────►│
        │                         6. issueAcademicVC(subject,ipfs,exp) ───────────────►│
        │                                │◄── txHash ──────────────────────────────────│
        │                                │                              │               │
        │                         7. Generate credentialHash (keccak256)│               │
        │                         8. Save to PostgreSQL                 │               │
        │                         9. Create audit log                   │               │
        │                                │                              │               │
        │◄───────────────────────────────│                              │               │
        │  { credentialHash, ipfsHash,   │                              │               │
        │    txHash, credentialId }      │                              │               │
```

### 10.2 Credential Verification

```
Verifier                           Backend                    PostgreSQL       IPFS        Blockchain
   │                                 │                            │             │              │
   │  GET /verify/:credentialHash    │                            │             │              │
   │────────────────────────────────►│                            │             │              │
   │                                 │                            │             │              │
   │                          1. Find credential by hash ────────►│             │              │
   │                                 │◄──── credential record ───│             │              │
   │                                 │                            │             │              │
   │                          2. Check isRevoked (DB) ───────────►│             │              │
   │                                 │◄──── revocation status ───│             │              │
   │                                 │                            │             │              │
   │                          3. Check isRevoked (chain) ─────────────────────────────────────►│
   │                                 │◄──── revocation status ────────────────────────────────│
   │                                 │                            │             │              │
   │                          4. (If params) Fetch IPFS data ─────────────────►│              │
   │                                 │◄──── encrypted payload ───────────────│              │
   │                                 │                            │             │              │
   │                          5. (If params) Decrypt + validate   │             │              │
   │                                 │                            │             │              │
   │                          6. Build public summary             │             │              │
   │                                 │                            │             │              │
   │◄────────────────────────────────│                            │             │              │
   │  { isValid, credential,         │                            │             │              │
   │    isRevokedDb, isRevokedOnChain,│                           │             │              │
   │    publicSummary,               │                            │             │              │
   │    parameterValidation? }       │                            │             │              │
```

### 10.3 QR Code Sharing Flow

```
Candidate (Wallet Page)                     Verifier (Verifier Page)
       │                                           │
       │  1. Click "Share" on credential            │
       │  2. ShareModal generates URL:              │
       │     <origin>/verifier?hash=<credHash>      │
       │  3. QRCodeSVG renders QR code              │
       │                                            │
       │  ─── Scan QR / Share Link ───────────────►│
       │                                            │
       │                                  4. useSearchParams()
       │                                     extracts ?hash=
       │                                  5. Auto-fills input
       │                                  6. "Pre-filled from QR" badge
       │                                  7. Click "Verify"
       │                                  8. GET /verify/:hash
       │                                            │
```

### 10.4 ZKP Proof Generation & Verification

```
Candidate                    Backend (ZKP Service)              Circom Circuit
   │                               │                                │
   │  POST /zkp/gpa/generate      │                                │
   │  { gpa:3.75, threshold:3.5,  │                                │
   │    credentialHash:"0x..." }   │                                │
   │──────────────────────────────►│                                │
   │                               │                                │
   │                        1. Scale: gpa=375, threshold=350        │
   │                        2. salt = randomBytes(32)               │
   │                        3. credHash = hexToBigInt("0x...")      │
   │                        4. commitment = Poseidon(375,salt,hash) │
   │                               │                                │
   │                        5. snarkjs.groth16.fullProve({          │
   │                             gpa: 375,                          │
   │                             salt: salt,                        │
   │                             credentialHash: hash,     ────────►│
   │                             threshold: 350,                    │
   │                             expectedCommitment: commitment     │
   │                           }, circuit.wasm, circuit.zkey)       │
   │                               │◄──────────────────────────────│
   │                               │  { proof, publicSignals }     │
   │                               │                                │
   │◄──────────────────────────────│                                │
   │  { proof, publicSignals,      │                                │
   │    commitment, salt }         │                                │
   │                               │                                │
   │                               │                                │
   │  POST /zkp/gpa/verify        │                                │
   │  { proof, publicSignals }     │                                │
   │──────────────────────────────►│                                │
   │                               │                                │
   │                        6. Load verification_key.json           │
   │                        7. snarkjs.groth16.verify(vkey,         │
   │                             publicSignals, proof)              │
   │                               │                                │
   │◄──────────────────────────────│                                │
   │  { isValid: true }            │                                │
```

---

## 11. API Reference

### 11.1 Authentication

#### `GET /api/v1/auth/nonce/:address`

Get a signing nonce for authentication.

| Parameter | Type | Description |
|---|---|---|
| `address` | Path (string) | Ethereum address |

**Response 200**:
```json
{
  "nonce": "a1b2c3d4e5f6..."
}
```

#### `POST /api/v1/auth/login`

Authenticate with wallet signature.

**Body**:
```json
{
  "address": "0x21649d3C84324082e3c3288009308CB9CC7C0B61",
  "signature": "0x...",
  "message": "Sign this message to login. Nonce: a1b2c3..."
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "address": "0x21649d3c84324082e3c3288009308cb9cc7c0b61",
      "role": "CANDIDATE"
    }
  }
}
```

#### `POST /api/v1/auth/register`

Register a new user.

**Body**:
```json
{
  "address": "0x...",
  "role": "UNIVERSITY",
  "email": "admin@university.edu"
}
```

**Validation**:
- `address`: Must be valid Ethereum address
- `role`: One of `UNIVERSITY | EMPLOYER | INTERNSHIP_PROVIDER | CANDIDATE | VERIFIER`
- `email`: Optional, must be valid email format

### 11.2 Credentials

#### `POST /api/v1/credentials/academic`

Issue an academic credential.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "subjectAddress": "0x...",
  "studentName": "Alice Johnson",
  "degree": "Bachelor of Science",
  "major": "Computer Science",
  "gpa": 3.75,
  "graduationYear": 2024,
  "institutionName": "MIT",
  "expiresAt": "2034-01-01T00:00:00Z"
}
```

**Validation**:
- `subjectAddress`: Valid Ethereum address
- `gpa`: Float, 0–10
- `graduationYear`: Integer, 1900–2100

**Response 201**:
```json
{
  "success": true,
  "data": {
    "credentialHash": "0xabc123...",
    "ipfsHash": "bafybeig...",
    "txHash": "0xdef456...",
    "credentialId": "uuid"
  }
}
```

#### `POST /api/v1/credentials/job`

Issue a job credential.

**Body**:
```json
{
  "subjectAddress": "0x...",
  "employeeName": "Bob Smith",
  "position": "Software Engineer",
  "startDate": "2020-01-15T00:00:00Z",
  "endDate": "2023-06-30T00:00:00Z",
  "experienceMonths": 42,
  "companyName": "Tech Corp",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

#### `POST /api/v1/credentials/internship`

Issue an internship credential.

**Body**:
```json
{
  "subjectAddress": "0x...",
  "internName": "Charlie Brown",
  "role": "Software Engineering Intern",
  "startDate": "2023-06-01T00:00:00Z",
  "endDate": "2023-08-31T00:00:00Z",
  "skills": ["Python", "Machine Learning"]
}
```

#### `GET /api/v1/credentials/:id`

Get credential by database ID.

**Headers**: `Authorization: Bearer <token>`

#### `GET /api/v1/credentials/subject/:address`

Get all credentials for a subject address.

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "credentialHash": "0x...",
      "credentialType": "ACADEMIC",
      "issuer": { "address": "0x..." },
      "issuedAt": "2024-01-15T10:30:00Z",
      "isRevoked": false,
      "ipfsHash": "bafybeig...",
      "txHash": "0x..."
    }
  ]
}
```

#### `GET /api/v1/credentials/:id/decrypted`

Get decrypted credential details (owner only).

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "type": "ACADEMIC",
    "issuer": { "address": "0x...", "name": "MIT" },
    "subject": { "address": "0x...", "name": "Alice Johnson" },
    "claims": {
      "degree": "Bachelor of Science",
      "major": "Computer Science",
      "gpa": 3.75,
      "graduationYear": 2024
    },
    "issuedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /api/v1/credentials/:id/revoke`

Revoke a credential (issuer only).

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "reason": "Fraudulent information detected"
}
```

### 11.3 Verification

#### `GET /api/v1/verification/verify/:credentialHash`

Public credential verification by hash.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "credential": {
      "credentialHash": "0x...",
      "type": "ACADEMIC",
      "issuedAt": "2024-01-15T10:30:00Z",
      "txHash": "0x...",
      "ipfsHash": "bafybeig...",
      "publicSummary": {
        "type": "ACADEMIC",
        "issuer": "0x...",
        "issuedAt": "2024-01-15T10:30:00Z"
      }
    },
    "isRevokedDb": false,
    "isRevokedOnChain": false
  }
}
```

#### `POST /api/v1/verification/verify-with-params`

Public verification with parameter checks.

**Body**:
```json
{
  "credentialHash": "0x...",
  "verificationParams": {
    "minGpa": 3.5,
    "requiredDegree": "Bachelor",
    "requiredMajor": "Computer Science",
    "minGraduationYear": 2020,
    "minExperience": 12,
    "requiredSkills": ["JavaScript", "React"]
  }
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "parameterValidation": {
      "isValid": true,
      "summary": "All 3 checks passed",
      "results": [
        {
          "parameter": "minGpa",
          "isValid": true,
          "required": 3.5,
          "actual": 3.75,
          "message": "GPA meets minimum requirement"
        },
        {
          "parameter": "requiredDegree",
          "isValid": true,
          "required": "Bachelor",
          "actual": "Bachelor of Science",
          "message": "Degree matches"
        }
      ]
    }
  }
}
```

### 11.4 Zero-Knowledge Proofs

#### `POST /api/v1/zkp/gpa/generate`

Generate a GPA proof.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "gpa": 3.75,
  "threshold": 3.5,
  "credentialHash": "0x..."
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": ["...", "...", "1"],
      "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
      "pi_c": ["...", "...", "1"],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "publicSignals": ["350", "12345678...", "1"],
    "commitment": "12345678...",
    "salt": "98765432..."
  }
}
```

#### `POST /api/v1/zkp/gpa/verify`

Verify a GPA proof.

**Body**:
```json
{
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
  "publicSignals": ["350", "12345678...", "1"]
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "isValid": true
  }
}
```

#### `POST /api/v1/zkp/experience/generate`

Generate an experience proof.

**Body**:
```json
{
  "experienceMonths": 42,
  "requiredMonths": 36,
  "credentialHash": "0x..."
}
```

#### `POST /api/v1/zkp/experience/verify`

Verify an experience proof. Same format as GPA verify.

### 11.5 DID

#### `POST /api/v1/did/register`

Register a DID on-chain.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "did": "did:ethr:0x...",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "serviceEndpoint": "https://example.com/did-service"
}
```

#### `GET /api/v1/did/:address`

Resolve DID by address (public).

### 11.6 Health Check

#### `GET /health`

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.678
}
```

---

## 12. Configuration & Environment

### 12.1 Environment Variables

All modules read from the root `.env` file at `/home/shresth/Desktop/Projects/AnonHire/.env`.

| Variable | Module | Description | Example |
|---|---|---|---|
| `SEPOLIA_RPC_URL` | Backend, Contracts | Ethereum Sepolia RPC endpoint | `https://sepolia.infura.io/v3/...` |
| `POLYGON_MUMBAI_RPC_URL` | Backend, Contracts | Polygon Mumbai RPC (optional) | `https://rpc-mumbai.maticvigil.com` |
| `PRIVATE_KEY` | Backend, Contracts | Deployer/signer private key | `0xabc...` |
| `ETHERSCAN_API_KEY` | Contracts | For contract verification | `ABC123...` |
| `PINATA_API_KEY` | Backend | IPFS pinning | `abc123...` |
| `PINATA_SECRET_KEY` | Backend | IPFS pinning | `def456...` |
| `IPFS_GATEWAY` | Backend | IPFS read gateway | `https://gateway.pinata.cloud/ipfs/` |
| `NODE_ENV` | Backend | Environment mode | `development` |
| `PORT` | Backend | API server port | `3001` |
| `JWT_SECRET` | Backend | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | Backend | Token expiration | `7d` |
| `DATABASE_URL` | Backend | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/anonhire` |
| `AES_SECRET_KEY` | Backend | Encryption key | `your-aes-256-key` |
| `CONTRACT_DID_REGISTRY` | Backend | Deployed contract address | `0x88d0...` |
| `CONTRACT_REVOCATION_REGISTRY` | Backend | Deployed contract address | `0x485d...` |
| `CONTRACT_VERIFIABLE_CREDENTIAL` | Backend | Deployed contract address | `0xd253...` |
| `CORS_ORIGIN` | Backend | Allowed frontend origin | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_CHAIN_ID` | Frontend | Default chain ID | `11155111` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Frontend | WalletConnect project ID | `YOUR_PROJECT_ID` |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Frontend | Sepolia RPC for wallet | `https://sepolia.infura.io/v3/...` |
| `LOG_LEVEL` | Backend | Winston log level | `info` |

### 12.2 Docker Compose

```yaml
services:
  postgres:     # PostgreSQL 15 Alpine, port 5432, persistent volume
  backend:      # Node.js 18, port 3001, depends on postgres
  frontend:     # Next.js, port 3000, depends on backend
```

### 12.3 Build Commands

| Command | Description |
|---|---|
| `npm run install:all` | Install all workspace dependencies |
| `npm run build:contracts` | `hardhat compile` |
| `npm run build:backend` | `tsc` |
| `npm run build:frontend` | `next build` |
| `npm run dev:backend` | `nodemon --exec ts-node src/index.ts` |
| `npm run dev:frontend` | `next dev` |
| `npm run deploy:testnet` | `hardhat run scripts/deploy.ts --network sepolia` |
| `npm run docker:up` | `docker-compose up -d` |

---

## 13. Deployment

### 13.1 Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Docker & Docker Compose
- Circom 2.x (`~/.cargo/bin/circom`)
- MetaMask or compatible wallet
- Infura/Alchemy account (for Sepolia RPC)
- Pinata account (for IPFS)
- Funded Sepolia wallet (for gas)

### 13.2 Step-by-Step Setup

```bash
# 1. Clone and install
git clone <repo>
cd AnonHire
bash scripts/setup.sh  # or manually:
npm install

# 2. Configure environment
cp .env.example .env   # edit with your values

# 3. Start database
docker-compose up -d postgres

# 4. Run migrations
cd backend && npx prisma db push && cd ..

# 5. Compile contracts
cd contracts && npx hardhat compile && cd ..

# 6. Deploy contracts (Sepolia)
cd contracts && npx hardhat run scripts/deploy.ts --network sepolia && cd ..
# Update .env with deployed addresses

# 7. Grant ISSUER_ROLE to backend wallet
# (done automatically in deploy script for RevocationRegistry,
#  but you may need to manually grant on VerifiableCredential)

# 8. Setup ZKP circuits
cd zkp
npm run setup:ptau      # download Powers of Tau
npm run compile         # compile circom circuits
npm run setup:keys      # generate proving/verification keys
cd ..

# 9. Start backend
npm run dev:backend     # http://localhost:3001

# 10. Start frontend
npm run dev:frontend    # http://localhost:3000
```

### 13.3 Production Considerations

| Area | Action |
|---|---|
| **Auth bypass** | Remove `bypassAuth` and `bypassAuthorize` from `credential.routes.ts` |
| **JWT secret** | Use strong random secret, rotate periodically |
| **AES key** | Use cryptographically random 256-bit key |
| **Rate limiting** | Replace in-memory store with Redis |
| **CORS** | Restrict to production domain |
| **HTTPS** | Use TLS termination (nginx/cloudflare) |
| **Database** | Use managed PostgreSQL (RDS, Cloud SQL) |
| **IPFS gateway** | Use dedicated Pinata gateway with access token |
| **Monitoring** | Add health checks, metrics (Prometheus), alerting |
| **Secrets** | Use secret manager (AWS Secrets Manager, Vault) |
| **ZKP keys** | Audit circuits, conduct proper trusted setup ceremony |

---

## 14. Glossary

| Term | Definition |
|---|---|
| **AES-256-GCM** | Advanced Encryption Standard with 256-bit key in Galois/Counter Mode. Provides both encryption and authentication. |
| **Circom** | Domain-specific language for writing arithmetic circuits used in ZKP systems. |
| **CID** | Content Identifier — IPFS's content-addressed hash for stored data. |
| **DID** | Decentralized Identifier — a globally unique identifier that doesn't require a central authority (e.g., `did:ethr:0x...`). |
| **Groth16** | A zkSNARK proving system that produces constant-size proofs with fast verification. Requires trusted setup. |
| **IPFS** | InterPlanetary File System — a peer-to-peer distributed file system for decentralized storage. |
| **JWT** | JSON Web Token — a compact, URL-safe means of representing claims between two parties. |
| **Pinata** | A service for pinning (persisting) content on IPFS with API access and CDN gateway. |
| **Poseidon** | A ZKP-friendly hash function optimized for arithmetic circuits. Much fewer constraints than SHA-256. |
| **Powers of Tau** | A trusted setup ceremony that generates common reference string (CRS) parameters for zkSNARKs. |
| **Prisma** | A modern ORM for Node.js and TypeScript with type-safe database queries and migration tools. |
| **R1CS** | Rank-1 Constraint System — the mathematical representation of a circuit's constraints. |
| **RainbowKit** | A React library that provides beautiful wallet connection UI for dApps. |
| **SSI** | Self-Sovereign Identity — a model where individuals control their own digital identities and credentials. |
| **wagmi** | A collection of React hooks for Ethereum (wallet connection, contract interaction, etc.). |
| **WASM** | WebAssembly — compiled circuit code used by snarkjs for witness generation. |
| **zkey** | The proving key file used by Groth16 to generate proofs for a specific circuit. |
| **zkSNARK** | Zero-Knowledge Succinct Non-interactive Argument of Knowledge — a proof system where a prover can convince a verifier of a statement without revealing the underlying data. |
| **ZKP** | Zero-Knowledge Proof — a cryptographic method where one party proves to another that a statement is true, without revealing any information beyond the statement itself. |

---

*Generated on: $(date)*
*AnonHire v1.0.0 — Employment Credential Verification System*
