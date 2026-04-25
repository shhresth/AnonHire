# AnonHire - Employment Credential Verification System

A credential issuance and verification system for academic, internship, and job records built with **SSI**, **IPFS**, **Ethereum/Polygon-style integrity checks**, and a **zero-knowledge verification layer**.

## 🎯 Features

- **Self-Sovereign Identity**: Candidates control their own credentials
- **Blockchain-Based Integrity**: Credential hashes and revocation state can be checked against the ledger
- **Decentralized Storage**: IPFS stores credential artifacts and public summaries
- **Encrypted Off-Chain Payloads**: Sensitive credential data is stored as AES-256-GCM encrypted payloads
- **ZKP Support**: Real Circom circuits exist for **GPA threshold** and **experience threshold** proofs
- **Parameter-Based Verification**: Degree, major, graduation year, skills, GPA, and experience can be verified through trusted backend decryption
- **Role-Based Access Control**: Separate interfaces for issuers, holders, and verifiers
- **Revocation Support**: Revoked credentials fail verification

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

## 🔎 Verification Methods

AnonHire currently supports **two verification methods**. The right method depends on what a verifier needs to confirm and how much privacy the credential holder requires.

---

### Method 1 — Manual Decryption (Parameter-Based Verification)

This method is used when a verifier needs to check specific credential fields — such as degree type, major, GPA, or experience duration — without a ZKP circuit existing for those fields yet.

**Endpoint:**
```
POST /api/v1/verification/verify
```

**Request body:**
```json
{
  "credentialHash": "<hash>",
  "verificationParams": {
    "minGpa": 3.5,
    "requiredDegree": "Bachelor of Science",
    "requiredMajor": "Computer Science",
    "minGraduationYear": 2022,
    "minExperience": 24,
    "requiredSkills": ["Python", "Docker"]
  }
}
```

**How it works:**

1. The verifier submits a `credentialHash` and the parameters they want to test via the verifier portal.
2. The backend loads the credential record from the database and checks revocation status (DB + best-effort blockchain).
3. If the credential is valid and `verificationParams` are present, the backend decrypts `credential.encryptedData` using AES-256-GCM.
4. The decrypted JSON payload is parsed and `credentialSubject` fields are read.
5. Each requested parameter is evaluated against the actual credential value.
6. The backend returns a structured field-by-field pass/fail report. Raw field values may be included in the internal comparison but are not the primary output surface for the verifier.

**Fields that can be checked this way:**

| Field | Parameter key | Credential types |
|---|---|---|
| GPA | `minGpa` | ACADEMIC |
| Degree | `requiredDegree` | ACADEMIC |
| Major | `requiredMajor` | ACADEMIC |
| Graduation year | `minGraduationYear` | ACADEMIC |
| Experience duration | `minExperience` | JOB |
| Skills | `requiredSkills` | JOB, INTERNSHIP |

**Example response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "parameterValidation": {
      "isValid": true,
      "summary": "All verification parameters met",
      "results": [
        {
          "parameter": "gpa",
          "required": ">= 3.5",
          "actual": 3.8,
          "isValid": true,
          "message": "GPA 3.8 meets requirement (>= 3.5)"
        },
        {
          "parameter": "degree",
          "required": "Bachelor of Science",
          "actual": "Bachelor of Science",
          "isValid": true,
          "message": "Degree Bachelor of Science matches requirement"
        }
      ]
    },
    "credential": {
      "type": "ACADEMIC",
      "issuedAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2034-01-15T10:00:00Z"
    }
  }
}
```

**Trust model:**

- Decryption happens **server-side only**. The verifier sees a pass/fail result, not the raw encrypted payload.
- This relies on a **trusted backend** to correctly decrypt and evaluate credential data.
- It is not cryptographic zero-knowledge verification — the backend learns the values during the check.
- This is the correct approach for fields where no dedicated ZKP circuit exists yet.

**For authenticity-only checks** (no parameter filtering needed), use the public GET endpoint instead:
```
GET /api/v1/verification/verify/:credentialHash
```
This returns validity status, revocation state, public metadata, and any IPFS public summary without touching the encrypted payload at all.

---

### Method 2 — Zero-Knowledge Proof Verification

This method provides **cryptographic privacy** for supported credential predicates. The verifier learns only whether a threshold condition holds — never the underlying private value.

**Currently supported predicates:**
- GPA threshold (academic credentials)
- Experience threshold in months (job and internship credentials)

---

#### Step 1 — Proof Generation (holder side)

The credential holder generates a ZKP from their own credential. The backend decrypts the credential internally, uses the private value as a circuit witness, and returns only the proof — the raw value is never sent to the client.

**GPA proof:**
```
POST /api/v1/zkp/gpa/generate-from-credential
```
```json
{
  "credentialId": "<uuid>",
  "threshold": 3.5
}
```

**Experience proof:**
```
POST /api/v1/zkp/experience/generate-from-credential
```
```json
{
  "credentialId": "<uuid>",
  "requiredMonths": 24
}
```

**Authorization rules for proof generation:**
- The requester must be authenticated.
- The credential's `subjectId` must match the authenticated user — only the holder can generate proofs from their own credential.
- The credential must be active (not revoked or otherwise invalid).
- GPA proofs require an `ACADEMIC` credential. Experience proofs require a `JOB` or `INTERNSHIP` credential.

**What the backend does internally:**
1. Looks up the credential by ID and verifies ownership.
2. Decrypts `encryptedData` using AES-256-GCM (in memory only).
3. Extracts the relevant private witness value (`gpa` or `experienceMonths`).
4. Constructs circuit inputs:
   - **Private witness**: the secret value from the credential
   - **Public inputs**: threshold and public constraint parameters
5. Runs the Circom circuit + SnarkJS prover to produce a zk-SNARK proof.
6. Returns the proof package and public signals. The raw private value is omitted from the response.

**Proof generation response:**
```json
{
  "success": true,
  "data": {
    "proofType": "gpa",
    "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...], "protocol": "groth16" },
    "publicSignals": ["1", "350", "1234567890..."],
    "threshold": 3.5,
    "credentialHash": "0xabc..."
  }
}
```

---

#### Step 2 — Proof Verification (verifier side)

The holder shares the proof package with the verifier (out-of-band or through the verifier portal). The verifier submits it for cryptographic verification — no decryption of any credential payload is required.

**GPA proof:**
```
POST /api/v1/zkp/gpa/verify
```

**Experience proof:**
```
POST /api/v1/zkp/experience/verify
```

**Request body (both endpoints):**
```json
{
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...], "protocol": "groth16" },
  "publicSignals": ["1", "350", "1234567890..."]
}
```

**What the backend does:**
1. Loads the verification key for the selected circuit.
2. Runs SnarkJS proof verification against the verification key and public signals.
3. Decodes public signals to extract the threshold and the circuit's validity flag.
4. Returns a human-readable decision.

**Verification response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "circuitValid": true,
    "threshold": "3.50",
    "message": "Zero-knowledge proof valid: GPA >= 3.50 confirmed"
  }
}
```

**Possible outcome states:**

| State | Meaning |
|---|---|
| `isValid: true`, `circuitValid: true` | Proof is cryptographically sound and the threshold condition is satisfied |
| `isValid: true`, `circuitValid: false` | Proof is cryptographically valid but the claimed condition was NOT met |
| `isValid: false` | Proof is malformed, forged, or uses the wrong circuit/key pair |
| Credential-level rejection (before proof step) | Revoked credential or unauthorized generation attempt |

**What the verifier learns vs. does not learn:**

| Learns | Does not learn |
|---|---|
| Proof is mathematically valid for the selected circuit | Exact GPA value |
| The claim (`value >= threshold`) holds for the committed witness | Exact experience month count |
| The public signals match the expected circuit format | Any other private fields in the credential payload |

**Concrete example:**
- Recruiter requires GPA ≥ 3.5.
- Candidate's credential stores GPA = 3.8 (encrypted).
- Candidate generates a GPA threshold proof via the wallet UI.
- Recruiter receives only the proof + public signals.
- Recruiter verifies: result confirms "GPA is at least 3.5" — the actual value 3.8 is never revealed.

---

### Comparison

| | Method 1 — Manual Decryption | Method 2 — ZKP |
|---|---|---|
| **Privacy** | Backend decrypts and evaluates privately; verifier sees pass/fail | Cryptographic zero-knowledge; verifier learns nothing beyond the predicate result |
| **Fields supported** | GPA, degree, major, graduation year, experience, skills | GPA threshold, experience threshold |
| **Requires holder action** | No — verifier submits hash + params directly | Yes — holder must generate and share proof |
| **Trust requirement** | Trusted backend | Cryptographic — no trust in backend required for verification |
| **Circuit dependency** | None | Correct `.zkey` and verification key pairing required |
| **Best for** | Multi-field checks, fields without circuits, recruiter workflows | Privacy-sensitive claims where exact values must stay hidden |

---

### Design rationale

The current hybrid design reflects a deliberate MVP trade-off:

- **Authenticity and revocation** are enforced through DB records plus best-effort blockchain checks regardless of which method is used.
- **Privacy-preserving proofs** are used where Circom circuits are stable and production-ready.
- **Trusted backend decryption** covers the remaining recruiter filters so the product is fully usable before a complete circuit suite is built.

Building a dedicated circuit for every field and every predicate type is expensive and slow to iterate on. For an MVP, it is better to:
- prove the end-to-end issuance, storage, and verification architecture works;
- demonstrate real zero-knowledge verification on the highest-value predicates first (GPA, experience);
- keep the remaining checks functional through encrypted server-side evaluation;
- clearly document which checks are cryptographic and which are trusted backend checks.

**Planned evolution:**
1. Add circuits for degree, major, skills, and selective-disclosure predicates.
2. Reduce the scope of server-side decryption during verification as circuits are added.
3. Shift more of the verifier trust model from backend logic to cryptographic proof verification.

---

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
│   │   │   ├── verification.controller.ts   # Method 1
│   │   │   └── zkp.controller.ts            # Method 2
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

### Scenario 1: Fresher with GPA Proof (ZKP)
1. University issues academic credential to candidate
2. Candidate stores credential in wallet
3. Recruiter requires GPA ≥ 3.5
4. Candidate generates a GPA threshold ZKP via the wallet — raw GPA stays server-side
5. Recruiter verifies the proof through the verifier portal; learns only that GPA ≥ 3.5 holds

### Scenario 2: Experienced Candidate (ZKP)
1. Previous employer issues a job credential (e.g. 36 months experience)
2. New employer requires ≥ 24 months experience
3. Candidate generates an experience threshold ZKP — raw month count is not revealed
4. Employer verifies the proof through the verifier portal

### Scenario 3: Multi-Field Check (Manual Decryption)
1. Recruiter wants to filter for: Bachelor's degree, Computer Science major, GPA ≥ 3.0, skills include Python
2. Verifier submits `credentialHash` + `verificationParams` to the verification endpoint
3. Backend decrypts the credential server-side, evaluates each field, and returns a field-by-field pass/fail report

### Scenario 4: Credential Revocation
1. University revokes a fraudulent credential
2. Verifier checks revocation status on-chain and in the DB
3. Verification fails regardless of which method is used — revocation is enforced upstream of both flows

## 🔒 Security Features

- **Role-Based Access Control**: Protected issuer/holder flows for issuance and proof generation
- **Encryption**: AES-256-GCM for sensitive off-chain payloads
- **Revocation Checks**: Verification fails for revoked credentials across both methods
- **Owner-Scoped Proof Generation**: Only the credential holder can generate ZKP proofs from their own credentials
- **Data Minimization in ZKP Flow**: Raw GPA and experience values remain server-side during proof generation and are excluded from all API responses
- **Explicit Trust Model**: Unsupported predicates are checked by trusted backend decryption and are never misrepresented as full zero-knowledge proofs

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Sepolia), Polygon (Mumbai/Mainnet)
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **ZKP**: Circom, SnarkJS (Groth16)
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