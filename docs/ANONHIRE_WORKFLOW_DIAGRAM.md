# AnonHire System Workflow Diagram

## Complete System Architecture & User Flows

```mermaid
graph TB
    %% User Types
    Student[👨‍🎓 Student/Candidate]
    University[🏫 University Issuer]
    Employer[🏢 Employer Issuer]
    Verifier[🔍 Verifier/HR]
    
    %% Frontend Applications
    Wallet[👛 Digital Wallet<br/>Frontend App]
    UniIssuer[🎓 University Issuer<br/>Frontend App]
    EmpIssuer[💼 Employer Issuer<br/>Frontend App]
    VerifierApp[🔍 Verifier<br/>Frontend App]
    
    %% Backend Services
    Backend[🔧 Backend API<br/>Express.js Server]
    Database[(🗄️ PostgreSQL<br/>Database)]
    
    %% Blockchain & Smart Contracts
    Blockchain[⛓️ Ethereum Sepolia<br/>Testnet]
    DIDRegistry[📋 DID Registry<br/>Smart Contract]
    RevocationRegistry[🚫 Revocation Registry<br/>Smart Contract]
    VCContract[📜 Verifiable Credential<br/>Smart Contract]
    
    %% IPFS & Storage
    IPFS[🌐 IPFS Network<br/>Pinata Service]
    
    %% ZKP System
    ZKP[🧮 Zero-Knowledge Proof<br/>System]
    MockZKP[🎭 Mock ZKP<br/>System]
    Circom[⚙️ Circom Circuits<br/>GPA & Experience]
    
    %% External Services
    MetaMask[🦊 MetaMask<br/>Wallet]
    Etherscan[🔍 Etherscan<br/>Block Explorer]
    
    %% User Flows - Credential Issuance
    Student --> Wallet
    University --> UniIssuer
    Employer --> EmpIssuer
    Verifier --> VerifierApp
    
    %% Frontend to Backend
    Wallet --> Backend
    UniIssuer --> Backend
    EmpIssuer --> Backend
    VerifierApp --> Backend
    
    %% Backend to Database
    Backend --> Database
    
    %% Backend to Blockchain
    Backend --> Blockchain
    Blockchain --> DIDRegistry
    Blockchain --> RevocationRegistry
    Blockchain --> VCContract
    
    %% Backend to IPFS
    Backend --> IPFS
    
    %% Backend to ZKP
    Backend --> ZKP
    ZKP --> MockZKP
    ZKP --> Circom
    
    %% Wallet Integration
    Wallet --> MetaMask
    MetaMask --> Blockchain
    
    %% External Verification
    VerifierApp --> Etherscan
    
    %% Styling
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef backendClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef blockchainClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef storageClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef zkpClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef externalClass fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    
    class Student,University,Employer,Verifier userClass
    class Wallet,UniIssuer,EmpIssuer,VerifierApp frontendClass
    class Backend,Database backendClass
    class Blockchain,DIDRegistry,RevocationRegistry,VCContract blockchainClass
    class IPFS storageClass
    class ZKP,MockZKP,Circom zkpClass
    class MetaMask,Etherscan externalClass
```

## Detailed User Workflows

### 1. Credential Issuance Flow

```mermaid
sequenceDiagram
    participant U as University Issuer
    participant UI as University Frontend
    participant B as Backend API
    participant DB as PostgreSQL
    participant IPFS as IPFS (Pinata)
    participant BC as Blockchain
    participant SC as Smart Contracts
    
    U->>UI: Fill credential form
    UI->>B: POST /api/v1/credentials/issue
    B->>DB: Store credential metadata
    B->>IPFS: Upload credential to IPFS
    IPFS-->>B: Return IPFS hash
    B->>BC: Deploy credential to blockchain
    BC->>SC: Store credential hash & metadata
    SC-->>BC: Transaction receipt
    BC-->>B: Contract address & transaction hash
    B->>DB: Update credential with blockchain info
    B-->>UI: Return credential details
    UI-->>U: Show success message
```

### 2. Credential Viewing & Management Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant W as Wallet Frontend
    participant B as Backend API
    participant DB as PostgreSQL
    participant IPFS as IPFS (Pinata)
    participant BC as Blockchain
    participant SC as Smart Contracts
    
    S->>W: Connect MetaMask wallet
    W->>B: GET /api/v1/credentials/wallet/:address
    B->>DB: Query user credentials
    DB-->>B: Return credential list
    B->>IPFS: Fetch credential details
    IPFS-->>B: Return credential data
    B->>BC: Verify credential on blockchain
    BC->>SC: Check credential validity
    SC-->>BC: Return verification status
    BC-->>B: Verification result
    B-->>W: Return complete credential data
    W-->>S: Display credentials in wallet
```

### 3. Zero-Knowledge Proof Generation Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant W as Wallet Frontend
    participant B as Backend API
    participant ZKP as ZKP System
    participant Mock as Mock ZKP
    participant Circom as Circom Circuits
    
    S->>W: Click "Generate ZKP"
    W->>B: POST /api/v1/zkp/generate
    B->>ZKP: Generate proof request
    alt Real ZKP Available
        ZKP->>Circom: Compile circuit
        Circom-->>ZKP: Compiled circuit
        ZKP->>ZKP: Generate proof
        ZKP-->>B: Return proof & verification key
    else Mock ZKP Fallback
        ZKP->>Mock: Generate mock proof
        Mock-->>ZKP: Return mock proof
        ZKP-->>B: Return mock proof
    end
    B-->>W: Return proof data
    W-->>S: Display proof generation result
```

### 4. Credential Verification Flow

```mermaid
sequenceDiagram
    participant V as Verifier
    participant VA as Verifier Frontend
    participant B as Backend API
    participant DB as PostgreSQL
    participant IPFS as IPFS (Pinata)
    participant BC as Blockchain
    participant SC as Smart Contracts
    participant ZKP as ZKP System
    
    V->>VA: Enter credential details
    VA->>B: POST /api/v1/verification/verify
    B->>IPFS: Fetch credential from IPFS
    IPFS-->>B: Return credential data
    B->>BC: Verify credential on blockchain
    BC->>SC: Check credential validity
    SC-->>BC: Return verification status
    BC-->>B: Blockchain verification result
    B->>ZKP: Verify ZKP proof (if provided)
    ZKP-->>B: ZKP verification result
    B->>DB: Log verification attempt
    B-->>VA: Return verification result
    VA-->>V: Display verification status
```

## System Architecture Overview

```mermaid
graph LR
    subgraph "Frontend Layer"
        A[Next.js Frontend Apps]
        B[React Components]
        C[MetaMask Integration]
    end
    
    subgraph "Backend Layer"
        D[Express.js API Server]
        E[Authentication Middleware]
        F[IPFS Service]
        G[ZKP Service]
    end
    
    subgraph "Data Layer"
        H[PostgreSQL Database]
        I[Prisma ORM]
    end
    
    subgraph "Blockchain Layer"
        J[Ethereum Sepolia]
        K[Smart Contracts]
        L[Hardhat Framework]
    end
    
    subgraph "Storage Layer"
        M[IPFS Network]
        N[Pinata Service]
    end
    
    subgraph "ZKP Layer"
        O[Circom Circuits]
        P[SnarkJS Library]
        Q[Mock ZKP System]
    end
    
    A --> D
    B --> A
    C --> A
    D --> E
    D --> F
    D --> G
    D --> H
    H --> I
    D --> J
    J --> K
    K --> L
    F --> M
    M --> N
    G --> O
    G --> P
    G --> Q
```

## Deployment Workflow

```mermaid
graph TD
    A[🚀 Start Deployment] --> B[📋 Check Prerequisites]
    B --> C{Node.js & npm<br/>Installed?}
    C -->|No| D[❌ Install Node.js]
    C -->|Yes| E[🔄 Stop Existing Processes]
    D --> E
    E --> F[📦 Install Dependencies]
    F --> G[🔧 Check Environment Config]
    G --> H{Smart Contracts<br/>Deployed?}
    H -->|No| I[🚀 Deploy Smart Contracts]
    H -->|Yes| J[🧮 Setup ZKP Circuits]
    I --> J
    J --> K[🗄️ Setup Database]
    K --> L[🔧 Start Backend Service]
    L --> M[🎨 Start Frontend Service]
    M --> N[🧪 Test System Functionality]
    N --> O{All Tests<br/>Passed?}
    O -->|No| P[❌ Fix Issues]
    O -->|Yes| Q[🎉 Deployment Complete!]
    P --> L
    Q --> R[🌐 System Ready for Use]
```

## Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend Technologies"
        A1[Next.js 14]
        A2[React 18]
        A3[TypeScript]
        A4[Tailwind CSS]
        A5[MetaMask SDK]
    end
    
    subgraph "Backend Technologies"
        B1[Node.js]
        B2[Express.js]
        B3[TypeScript]
        B4[Prisma ORM]
        B5[JWT Authentication]
    end
    
    subgraph "Database"
        C1[PostgreSQL 15]
        C2[Prisma Schema]
        C3[Database Migrations]
    end
    
    subgraph "Blockchain"
        D1[Ethereum Sepolia]
        D2[Solidity 0.8.20]
        D3[Hardhat Framework]
        D4[Smart Contracts]
    end
    
    subgraph "Storage"
        E1[IPFS Protocol]
        E2[Pinata Service]
        E3[Decentralized Storage]
    end
    
    subgraph "Zero-Knowledge Proofs"
        F1[Circom 2.0]
        F2[SnarkJS]
        F3[Powers of Tau]
        F4[Mock ZKP System]
    end
    
    subgraph "DevOps & Deployment"
        G1[Docker & Docker Compose]
        G2[PowerShell Scripts]
        G3[Bash Scripts]
        G4[CI/CD Pipeline]
    end
```

## Key Features & Capabilities

```mermaid
mindmap
  root((AnonHire System))
    Credential Management
      Issue Credentials
        University Degrees
        Employment Records
        Professional Certifications
      Store on IPFS
        Decentralized Storage
        Immutable Records
        Global Accessibility
      Blockchain Verification
        Smart Contract Storage
        Public Verification
        Tamper-Proof Records
    
    Zero-Knowledge Proofs
      GPA Proofs
        Prove GPA ≥ Threshold
        Hide Actual GPA
        Academic Verification
      Experience Proofs
        Prove Work Experience
        Hide Specific Details
        Professional Verification
      Mock System
        Development Testing
        Fallback Option
        Full Functionality
    
    User Interfaces
      Digital Wallet
        View Credentials
        Generate ZKP Proofs
        Share Credentials
      Issuer Portals
        University Portal
        Employer Portal
        Credential Creation
      Verifier Interface
        Credential Verification
        ZKP Verification
        Audit Trail
    
    Security & Privacy
      Cryptographic Security
        AES-256 Encryption
        JWT Authentication
        Wallet Signatures
      Privacy Protection
        Zero-Knowledge Proofs
        Selective Disclosure
        Data Minimization
      Audit & Compliance
        Verification Logs
        Blockchain Records
        Immutable History
```

This comprehensive workflow diagram shows the complete AnonHire system architecture, user flows, and technology stack. The system provides a full-featured credential verification platform with blockchain integration, IPFS storage, and zero-knowledge proof capabilities.
