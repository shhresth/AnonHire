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

### 5. DID Creation & Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Wallet Frontend
    participant B as Backend API
    participant MM as MetaMask
    participant BC as Blockchain
    participant DID as DID Registry Contract
    
    U->>W: Request to create DID
    W->>MM: Request wallet connection
    MM-->>W: Return wallet address
    W->>B: POST /api/v1/did/create
    Note over B: Generate DID from wallet address
    B->>B: Create DID: did:ethr:{address}
    B->>BC: Register DID on blockchain
    BC->>DID: registerDID(address, did)
    DID-->>BC: Transaction receipt
    BC-->>B: DID registered successfully
    B->>B: Store DID mapping in database
    B-->>W: Return DID details
    W-->>U: Display DID creation success
```

### 6. Credential Revocation Flow

```mermaid
sequenceDiagram
    participant I as Issuer
    participant IF as Issuer Frontend
    participant B as Backend API
    participant DB as PostgreSQL
    participant BC as Blockchain
    participant RR as Revocation Registry
    participant IPFS as IPFS
    
    I->>IF: Select credential to revoke
    IF->>B: POST /api/v1/credentials/revoke
    B->>DB: Check credential exists
    DB-->>B: Return credential data
    B->>BC: Revoke credential on blockchain
    BC->>RR: revokeCredential(credentialId, reason)
    RR-->>BC: Transaction receipt
    BC-->>B: Revocation confirmed
    B->>DB: Update credential status to revoked
    B->>IPFS: Update credential metadata
    IPFS-->>B: Updated IPFS hash
    B->>DB: Store revocation details
    B-->>IF: Return revocation confirmation
    IF-->>I: Show revocation success
```

## Algorithm & Decision Flowcharts

### 1. ZKP Proof Verification Algorithm

```mermaid
flowchart TD
    Start([Start ZKP Verification]) --> Input[Receive Proof Data]
    Input --> CheckFormat{Proof Format<br/>Valid?}
    CheckFormat -->|No| Error1[Return Invalid Format Error]
    CheckFormat -->|Yes| CheckType{Proof Type?}
    
    CheckType -->|GPA Proof| ValidateGPA[Validate GPA Proof]
    CheckType -->|Experience Proof| ValidateExp[Validate Experience Proof]
    CheckType -->|Mock Proof| ValidateMock[Validate Mock Proof]
    
    ValidateGPA --> CheckCircuit{Circuit Compiled<br/>& Available?}
    CheckCircuit -->|No| FallbackMock[Use Mock ZKP]
    CheckCircuit -->|Yes| LoadGPA[Load GPA Circuit]
    LoadGPA --> VerifyGPA[Verify Proof with SnarkJS]
    
    ValidateExp --> CheckCircuitExp{Experience Circuit<br/>Available?}
    CheckCircuitExp -->|No| FallbackMock
    CheckCircuitExp -->|Yes| LoadExp[Load Experience Circuit]
    LoadExp --> VerifyExp[Verify Proof with SnarkJS]
    
    ValidateMock --> VerifyMock[Verify Mock Proof Signature]
    FallbackMock --> VerifyMock
    
    VerifyGPA --> CheckResult{Verification<br/>Successful?}
    VerifyExp --> CheckResult
    VerifyMock --> CheckResult
    
    CheckResult -->|Yes| Success[Return Verified Status]
    CheckResult -->|No| Error2[Return Verification Failed]
    
    Success --> LogSuccess[Log Verification Success]
    Error1 --> LogError[Log Error]
    Error2 --> LogError
    LogSuccess --> End([End])
    LogError --> End
```

### 2. Credential Verification Decision Flow

```mermaid
flowchart TD
    Start([Start Verification]) --> Receive[Receive Credential Request]
    Receive --> ValidateInput{Input Data<br/>Valid?}
    ValidateInput -->|No| Error1[Return Validation Error]
    ValidateInput -->|Yes| CheckIPFS{Credential in<br/>IPFS?}
    
    CheckIPFS -->|No| Error2[Return Credential Not Found]
    CheckIPFS -->|Yes| FetchIPFS[Fetch Credential from IPFS]
    FetchIPFS --> Parse[Parse Credential Data]
    Parse --> CheckRevoked{Is Credential<br/>Revoked?}
    
    CheckRevoked -->|Yes| Error3[Return Revoked Status]
    CheckRevoked -->|No| CheckBlockchain{Check Blockchain<br/>Registration}
    
    CheckBlockchain --> VerifyHash{Credential Hash<br/>Matches?}
    VerifyHash -->|No| Error4[Return Hash Mismatch]
    VerifyHash -->|Yes| CheckIssuer{Issuer DID<br/>Valid?}
    
    CheckIssuer -->|No| Error5[Return Invalid Issuer]
    CheckIssuer -->|Yes| CheckZKP{ZKP Proof<br/>Provided?}
    
    CheckZKP -->|Yes| VerifyZKP[Verify ZKP Proof]
    VerifyZKP --> ZKPResult{ZKP Verification<br/>Successful?}
    ZKPResult -->|No| Error6[Return ZKP Verification Failed]
    ZKPResult -->|Yes| Success[Return Verified Status]
    
    CheckZKP -->|No| Success
    
    Success --> LogVerify[Log Verification Success]
    Error1 --> LogError[Log Error]
    Error2 --> LogError
    Error3 --> LogError
    Error4 --> LogError
    Error5 --> LogError
    Error6 --> LogError
    
    LogVerify --> End([End])
    LogError --> End
```

### 3. Credential Lifecycle Flowchart

```mermaid
flowchart LR
    Start([Credential Lifecycle]) --> Create[📝 Create Credential]
    Create --> Issue[✅ Issue Credential]
    Issue --> StoreIPFS[🌐 Store on IPFS]
    StoreIPFS --> RegisterBC[⛓️ Register on Blockchain]
    RegisterBC --> Active[(🟢 Active Status)]
    
    Active --> View[👀 View Credential]
    Active --> GenerateZKP[🧮 Generate ZKP]
    Active --> Share[📤 Share Credential]
    Active --> Verify[🔍 Verify Credential]
    Active --> Revoke{Revoke?}
    
    Revoke -->|No| Active
    Revoke -->|Yes| RevokeBC[🚫 Revoke on Blockchain]
    RevokeBC --> Revoked[(🔴 Revoked Status)]
    
    Revoked --> Check[❌ Verification Fails]
    View --> Active
    GenerateZKP --> Active
    Share --> Active
    Verify --> Valid{Valid?}
    Valid -->|Yes| Verified[(✅ Verified)]
    Valid -->|No| Invalid[(❌ Invalid)]
    
    Verified --> End([End])
    Invalid --> End
    Check --> End
```

### 4. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant MM as MetaMask
    participant DB as Database
    participant JWT as JWT Service
    
    U->>F: Access Protected Resource
    F->>B: API Request
    B->>B: Extract Auth Token
    
    alt Token Present
        B->>JWT: Verify JWT Token
        JWT-->>B: Token Valid/Invalid
        alt Token Valid
            B->>DB: Get User from Token
            DB-->>B: User Data
            B->>B: Check Permissions
            alt Authorized
                B-->>F: Return Requested Data
                F-->>U: Display Content
            else Unauthorized
                B-->>F: 403 Forbidden
                F-->>U: Show Access Denied
            end
        else Token Invalid/Expired
            B-->>F: 401 Unauthorized
            F->>MM: Request Wallet Connection
            MM-->>F: Wallet Signature
            F->>B: POST /api/v1/auth/login
            B->>DB: Verify Wallet Address
            DB-->>B: User Found/Create
            B->>JWT: Generate JWT Token
            JWT-->>B: Token
            B-->>F: Return Token & User Data
            F->>F: Store Token
            F->>B: Retry Original Request
        end
    else No Token
        B-->>F: 401 Unauthorized
        F->>MM: Request Wallet Connection
        MM-->>F: Wallet Signature
        F->>B: POST /api/v1/auth/login
        B->>DB: Verify/Create User
        DB-->>B: User Data
        B->>JWT: Generate JWT Token
        JWT-->>B: Token
        B-->>F: Return Token & User Data
        F->>F: Store Token
        F->>B: Retry Original Request
    end
```

### 5. Smart Contract Interaction Flow

```mermaid
flowchart TD
    Start([Contract Operation Request]) --> SelectOp{Operation Type?}
    
    SelectOp -->|Create DID| DIDFlow[Create DID Flow]
    SelectOp -->|Issue Credential| CredFlow[Issue Credential Flow]
    SelectOp -->|Revoke Credential| RevFlow[Revoke Credential Flow]
    SelectOp -->|Verify Credential| VerifyFlow[Verify Credential Flow]
    
    DIDFlow --> CheckWallet{Wallet<br/>Connected?}
    CheckWallet -->|No| ConnectWallet[Connect MetaMask Wallet]
    CheckWallet -->|Yes| PrepDIDTx[Prepare DID Registration Transaction]
    ConnectWallet --> PrepDIDTx
    PrepDIDTx --> SendDIDTx[Send Transaction to DID Registry]
    
    CredFlow --> ValidateCred{Validate<br/>Credential Data}
    ValidateCred -->|Invalid| Error1[Return Validation Error]
    ValidateCred -->|Valid| PrepCredTx[Prepare Credential Transaction]
    PrepCredTx --> SendCredTx[Send Transaction to VC Contract]
    
    RevFlow --> CheckAuth{Is Authorized<br/>to Revoke?}
    CheckAuth -->|No| Error2[Return Authorization Error]
    CheckAuth -->|Yes| PrepRevTx[Prepare Revocation Transaction]
    PrepRevTx --> SendRevTx[Send Transaction to Revocation Registry]
    
    VerifyFlow --> FetchCred[Fetch Credential from Contract]
    FetchCred --> CheckStatus{Credential<br/>Status?}
    CheckStatus -->|Revoked| Error3[Return Revoked Status]
    CheckStatus -->|Active| ValidateHash{Validate<br/>Credential Hash}
    ValidateHash -->|Invalid| Error4[Return Invalid Hash]
    ValidateHash -->|Valid| ReturnValid[Return Valid Status]
    
    SendDIDTx --> WaitConfirm[Wait for Transaction Confirmation]
    SendCredTx --> WaitConfirm
    SendRevTx --> WaitConfirm
    
    WaitConfirm --> CheckConfirm{Transaction<br/>Confirmed?}
    CheckConfirm -->|No| TimeoutError[Handle Timeout]
    CheckConfirm -->|Yes| ParseResult[Parse Transaction Receipt]
    ParseResult --> UpdateDB[Update Database with Result]
    UpdateDB --> ReturnSuccess[Return Success Response]
    
    ReturnSuccess --> End([End])
    ReturnValid --> End
    Error1 --> End
    Error2 --> End
    Error3 --> End
    Error4 --> End
    TimeoutError --> End
```

### 6. IPFS Upload & Retrieval Algorithm

```mermaid
flowchart TD
    Start([IPFS Operation]) --> OpType{Operation<br/>Type?}
    
    OpType -->|Upload| UploadFlow[Upload Flow]
    OpType -->|Retrieve| RetrieveFlow[Retrieve Flow]
    
    UploadFlow --> Prepare[Prepare Credential Data]
    Prepare --> Encrypt{Need<br/>Encryption?}
    Encrypt -->|Yes| EncryptData[Encrypt Data with AES-256]
    Encrypt -->|No| ValidateData[Validate Data Structure]
    EncryptData --> ValidateData
    
    ValidateData -->|Invalid| Error1[Return Validation Error]
    ValidateData -->|Valid| ConvertJSON[Convert to JSON]
    ConvertJSON --> UploadIPFS[Upload to Pinata IPFS]
    
    UploadIPFS --> CheckUpload{Upload<br/>Successful?}
    CheckUpload -->|No| Error2[Return Upload Error]
    CheckUpload -->|Yes| GetHash[Retrieve IPFS Hash CID]
    GetHash --> StoreHash[Store Hash in Database]
    StoreHash --> ReturnCID[Return IPFS Hash]
    
    RetrieveFlow --> GetCID[Get IPFS Hash CID]
    GetCID --> CheckCID{CID<br/>Valid?}
    CheckCID -->|No| Error3[Return Invalid CID]
    CheckCID -->|Yes| FetchIPFS[Fetch from Pinata IPFS]
    
    FetchIPFS --> CheckFetch{Fetch<br/>Successful?}
    CheckFetch -->|No| Error4[Return Fetch Error]
    CheckFetch -->|Yes| ParseData[Parse Retrieved Data]
    ParseData --> Decrypt{Data<br/>Encrypted?}
    
    Decrypt -->|Yes| DecryptData[Decrypt Data]
    Decrypt -->|No| ValidateRetrieved[Validate Retrieved Data]
    DecryptData --> ValidateRetrieved
    
    ValidateRetrieved -->|Invalid| Error5[Return Invalid Data Error]
    ValidateRetrieved -->|Valid| ReturnData[Return Credential Data]
    
    ReturnCID --> End([End])
    ReturnData --> End
    Error1 --> End
    Error2 --> End
    Error3 --> End
    Error4 --> End
    Error5 --> End
```

This comprehensive workflow diagram shows the complete AnonHire system architecture, user flows, and technology stack. The system provides a full-featured credential verification platform with blockchain integration, IPFS storage, and zero-knowledge proof capabilities.
