# AnonHire API Documentation

Complete API reference for AnonHire backend.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.anonhire.com/api/v1
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Get Nonce

Get a nonce for signing.

```http
GET /auth/nonce/:address
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "0x..."
  }
}
```

### Login

Login with Ethereum signature.

```http
POST /auth/login
```

**Request:**
```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Sign this message with nonce: 0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "address": "0x...",
      "role": "CANDIDATE",
      "did": "did:ethr:0x..."
    }
  }
}
```

### Register

Register a new user.

```http
POST /auth/register
```

**Request:**
```json
{
  "address": "0x...",
  "role": "CANDIDATE",
  "email": "user@example.com"
}
```

**Roles:** `UNIVERSITY`, `EMPLOYER`, `INTERNSHIP_PROVIDER`, `CANDIDATE`, `VERIFIER`

## Credentials

### Issue Academic Credential

```http
POST /credentials/academic
Authorization: Bearer <token>
```

**Request:**
```json
{
  "subjectAddress": "0x...",
  "studentName": "Alice Johnson",
  "degree": "Bachelor of Science",
  "major": "Computer Science",
  "gpa": 3.75,
  "graduationYear": 2023,
  "institutionName": "MIT",
  "expiresAt": "2025-12-31T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credentialId": "uuid",
    "credentialHash": "0x...",
    "ipfsHash": "Qm...",
    "txHash": "0x..."
  }
}
```

### Issue Job Credential

```http
POST /credentials/job
Authorization: Bearer <token>
```

**Request:**
```json
{
  "subjectAddress": "0x...",
  "employeeName": "Bob Smith",
  "position": "Software Engineer",
  "startDate": "2020-01-15",
  "endDate": "2023-06-30",
  "experienceMonths": 42,
  "companyName": "Tech Corp",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

### Issue Internship Credential

```http
POST /credentials/internship
Authorization: Bearer <token>
```

**Request:**
```json
{
  "subjectAddress": "0x...",
  "internName": "Charlie Brown",
  "role": "Software Intern",
  "startDate": "2023-06-01",
  "endDate": "2023-08-31",
  "companyName": "Startup Inc",
  "skills": ["Python", "FastAPI"]
}
```

### Get Credential

```http
GET /credentials/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "credentialHash": "0x...",
    "credentialType": "ACADEMIC",
    "issuer": {
      "address": "0x...",
      "did": "did:ethr:0x..."
    },
    "subject": {
      "address": "0x...",
      "did": "did:ethr:0x..."
    },
    "ipfsHash": "Qm...",
    "issuedAt": "2023-05-15T10:30:00Z",
    "expiresAt": null,
    "isRevoked": false
  }
}
```

### Get Subject Credentials

```http
GET /credentials/subject/:address
Authorization: Bearer <token>
```

### Get Issuer Credentials

```http
GET /credentials/issuer/:address
Authorization: Bearer <token>
```

### Revoke Credential

```http
POST /credentials/:id/revoke
Authorization: Bearer <token>
```

**Request:**
```json
{
  "reason": "Fraudulent information detected"
}
```

## Zero-Knowledge Proofs

### Generate GPA Proof

```http
POST /zkp/gpa/generate
Authorization: Bearer <token>
```

**Request:**
```json
{
  "gpa": 3.75,
  "threshold": 3.5,
  "credentialHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": [...],
      "pi_b": [...],
      "pi_c": [...],
      "protocol": "groth16"
    },
    "publicSignals": ["350", "..."],
    "salt": "12345..."
  }
}
```

### Verify GPA Proof

```http
POST /zkp/gpa/verify
Authorization: Bearer <token>
```

**Request:**
```json
{
  "proof": {...},
  "publicSignals": [...],
  "credentialId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "message": "Proof verified successfully"
  }
}
```

### Generate Experience Proof

```http
POST /zkp/experience/generate
Authorization: Bearer <token>
```

**Request:**
```json
{
  "experienceMonths": 42,
  "requiredMonths": 36,
  "credentialHash": "0x..."
}
```

### Verify Experience Proof

```http
POST /zkp/experience/verify
Authorization: Bearer <token>
```

## Verification

### Verify Credential

```http
POST /verification/verify
Authorization: Bearer <token>
```

**Request:**
```json
{
  "credentialHash": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "credential": {
      "type": "ACADEMIC",
      "issuer": "0x...",
      "subject": "0x...",
      "issuedAt": "2023-05-15T10:30:00Z",
      "expiresAt": null
    },
    "verificationId": "uuid"
  }
}
```

### Get Verification

```http
GET /verification/:id
Authorization: Bearer <token>
```

### Get Credential Verifications

```http
GET /verification/credential/:credentialId
Authorization: Bearer <token>
```

## DID Management

### Register DID

```http
POST /did/register
Authorization: Bearer <token>
```

**Request:**
```json
{
  "did": "did:ethr:0x...",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...",
  "serviceEndpoint": "https://example.com/did"
}
```

### Resolve DID

```http
GET /did/:address
```

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:ethr:0x...",
    "owner": "0x...",
    "publicKeyPem": "...",
    "serviceEndpoint": "...",
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "isActive": true
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

- Rate limit: 100 requests per minute per IP
- Burst: 20 requests
- Headers:
  - `X-RateLimit-Limit`: Rate limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Webhooks (Coming Soon)

Subscribe to events:
- Credential issued
- Credential revoked
- Verification completed

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AnonHireClient } from '@anonhire/sdk';

const client = new AnonHireClient({
  apiUrl: 'https://api.anonhire.com',
  token: 'your-jwt-token'
});

// Issue credential
const credential = await client.credentials.issueAcademic({
  subjectAddress: '0x...',
  studentName: 'Alice',
  degree: 'BS',
  major: 'CS',
  gpa: 3.75,
  graduationYear: 2023,
  institutionName: 'MIT'
});

// Generate ZKP
const proof = await client.zkp.generateGPAProof({
  gpa: 3.75,
  threshold: 3.5,
  credentialHash: credential.credentialHash
});

// Verify
const result = await client.zkp.verifyGPAProof(proof);
```

### Python (Coming Soon)

```python
from anonhire import AnonHireClient

client = AnonHireClient(
    api_url='https://api.anonhire.com',
    token='your-jwt-token'
)

# Issue credential
credential = client.credentials.issue_academic(
    subject_address='0x...',
    student_name='Alice',
    degree='BS',
    major='CS',
    gpa=3.75,
    graduation_year=2023,
    institution_name='MIT'
)
```

## Support

- Documentation: https://docs.anonhire.com
- GitHub Issues: https://github.com/anonhire/issues
- Discord: https://discord.gg/anonhire


