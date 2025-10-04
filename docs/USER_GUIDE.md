# AnonHire User Guide

Complete guide for using the AnonHire Employment Credential Verification System.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [For Candidates](#for-candidates)
4. [For Universities](#for-universities)
5. [For Employers](#for-employers)
6. [For Verifiers](#for-verifiers)
7. [Understanding Zero-Knowledge Proofs](#understanding-zero-knowledge-proofs)
8. [FAQ](#faq)

## Introduction

AnonHire is a privacy-preserving credential verification system that allows you to:

- **Prove qualifications** without revealing sensitive details
- **Verify credentials** instantly using blockchain
- **Maintain control** over your personal data
- **Prevent fraud** with immutable records

### Key Benefits

- ✅ **Privacy-First**: Prove you meet requirements without full disclosure
- ✅ **Instant Verification**: No waiting for background checks
- ✅ **Fraud-Resistant**: Blockchain-backed credentials can't be forged
- ✅ **Portable**: Your credentials work anywhere
- ✅ **Self-Sovereign**: You control your data

## Getting Started

### 1. Install MetaMask

Download and install [MetaMask](https://metamask.io/) browser extension.

### 2. Get Test Tokens

For testnet (Sepolia):
- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Receive test ETH

### 3. Connect Wallet

1. Go to [app.anonhire.com](https://app.anonhire.com)
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve connection

### 4. Register

1. Click "Register"
2. Select your role:
   - **Candidate**: Receive and share credentials
   - **University**: Issue academic credentials
   - **Employer**: Issue job credentials
   - **Verifier**: Verify credentials
3. Sign the registration message
4. Complete!

## For Candidates

### Receiving Credentials

When a university or employer issues a credential to you:

1. You'll see it in "My Wallet"
2. Credential includes:
   - Type (Academic/Job/Internship)
   - Issuer name
   - Issuance date
   - Expiration date (if any)

### Viewing Credentials

```
1. Go to "My Wallet"
2. Browse your credentials
3. Click a credential to view details
```

### Sharing Credentials

**Option A: Full Disclosure**

Share the complete credential:

```
1. Select credential
2. Click "Share"
3. Choose recipient
4. Send link or QR code
```

**Option B: Zero-Knowledge Proof**

Prove specific facts without revealing everything:

#### Example: Prove GPA ≥ 3.5

```
1. Select academic credential
2. Click "Generate Proof"
3. Choose "GPA Threshold"
4. Set threshold: 3.5
5. Generate proof
6. Share proof (not full transcript)
```

**What the verifier sees:**
- ✅ GPA ≥ 3.5: TRUE
- ❌ Actual GPA: HIDDEN
- ❌ Courses: HIDDEN
- ❌ Grades: HIDDEN

#### Example: Prove ≥3 Years Experience

```
1. Select job credential
2. Click "Generate Proof"
3. Choose "Experience Threshold"
4. Set months: 36 (3 years)
5. Generate proof
6. Share proof
```

**What the verifier sees:**
- ✅ Experience ≥ 3 years: TRUE
- ❌ Exact duration: HIDDEN
- ❌ Company name: HIDDEN
- ❌ Position details: HIDDEN

### Managing Credentials

**Organize:**
- Star important credentials
- Add tags
- Archive old ones

**Security:**
- Backup your wallet seed phrase
- Never share private keys
- Use hardware wallet for extra security

## For Universities

### Issuing Academic Credentials

1. **Access Issuer Dashboard**
   ```
   Role: UNIVERSITY
   Page: /issuer/university
   ```

2. **Issue Credential**
   ```
   1. Click "Issue New Credential"
   2. Fill student information:
      - Student wallet address
      - Name
      - Degree
      - Major
      - GPA
      - Graduation year
   3. Review details
   4. Click "Issue"
   5. Confirm blockchain transaction
   ```

3. **Verification**
   - Transaction appears on blockchain
   - Credential stored on IPFS
   - Student receives notification

### Bulk Issuance

For graduating classes:

```
1. Prepare CSV file:
   address,name,degree,major,gpa,year
   0x...,Alice,BS,CS,3.75,2023
   0x...,Bob,BS,EE,3.50,2023

2. Upload CSV
3. Review batch
4. Issue all (one transaction per credential)
```

### Revoking Credentials

If fraud is detected:

```
1. Find credential in issued list
2. Click "Revoke"
3. Enter reason
4. Confirm transaction
5. Credential marked as revoked on-chain
```

**Note:** Revocation is permanent and publicly visible.

## For Employers

### Issuing Job Credentials

1. **Access Employer Dashboard**
   ```
   Role: EMPLOYER
   Page: /issuer/employer
   ```

2. **Issue Job Credential**
   ```
   1. Click "Issue Employment Credential"
   2. Fill employee information:
      - Employee wallet address
      - Name
      - Position
      - Start date
      - End date
      - Skills
   3. Review
   4. Issue
   ```

### Issuing Internship Credentials

Similar process for interns:

```
1. Select "Internship" type
2. Fill details
3. Issue credential
```

### Verifying Candidates

When hiring:

```
1. Request proof from candidate
2. Receive proof link
3. System verifies automatically
4. See result: Valid/Invalid
5. Make hiring decision
```

## For Verifiers

### Verifying Credentials

1. **Access Verifier Portal**
   ```
   Role: VERIFIER
   Page: /verifier
   ```

2. **Full Credential Verification**
   ```
   1. Candidate shares credential hash
   2. Enter hash in verification form
   3. Click "Verify"
   4. See results:
      - Valid/Invalid
      - Issuer
      - Issuance date
      - Revocation status
   ```

3. **Zero-Knowledge Proof Verification**
   ```
   1. Receive proof from candidate
   2. System verifies cryptographically
   3. See result:
      - Proof valid: TRUE/FALSE
      - Threshold met: TRUE/FALSE
      - No personal details visible
   ```

### Understanding Results

**Valid Credential:**
- ✅ Exists on blockchain
- ✅ Not revoked
- ✅ Not expired
- ✅ Issued by trusted entity

**Invalid Credential:**
- ❌ Not found on blockchain
- ❌ Revoked by issuer
- ❌ Expired
- ❌ Forged/tampered

### Verification History

Track all verifications:
```
1. Go to "Verification History"
2. See list of all credentials verified
3. Export reports
```

## Understanding Zero-Knowledge Proofs

### What are ZKPs?

Zero-Knowledge Proofs allow you to **prove a statement is true without revealing why it's true**.

### Real-World Analogy

**Traditional way:**
- You: "I have a driver's license"
- Them: "Show me"
- You: *Shows license with photo, address, DOB, etc.*

**With ZKP:**
- You: "I'm over 21"
- Them: "Prove it"
- You: *Generates proof*
- Them: *Verifies: TRUE* (no personal info revealed)

### How It Works

1. **You have a credential** (e.g., transcript with GPA 3.75)
2. **Generate proof** using your data + secret salt
3. **Verifier checks** proof mathematically
4. **Result**: TRUE/FALSE (no data leaked)

### When to Use ZKPs

Use when you want to prove:
- GPA above threshold
- Years of experience
- Age verification
- Salary range
- Skills certification

**Don't use when:**
- Full disclosure is needed
- Building trust requires transparency
- Legal requirements mandate full documents

## FAQ

### General

**Q: Is my data stored on the blockchain?**

A: No. Only a hash (fingerprint) is on-chain. Actual data is encrypted on IPFS.

**Q: Can I delete my credentials?**

A: You control your wallet. You can stop sharing credentials anytime. The blockchain record remains for integrity, but the IPFS data can be unpinned (GDPR compliance).

**Q: What if I lose my wallet?**

A: Your seed phrase is the only way to recover. Write it down and store securely. Lost seed = lost access forever.

**Q: Are credentials transferable?**

A: No. Credentials are tied to your wallet address and cannot be transferred.

### For Candidates

**Q: Do I need to pay for credentials?**

A: No. Universities/employers pay the gas fees for issuance.

**Q: Can employers see my other credentials?**

A: Only what you share. Your wallet is private.

**Q: What if my credential is wrong?**

A: Contact the issuer to revoke and reissue correctly.

### For Issuers

**Q: How much does issuance cost?**

A: Gas fees on Ethereum (~$5-20) or Polygon (~$0.01). Varies with network congestion.

**Q: Can I edit a credential after issuance?**

A: No. Blockchain records are immutable. Must revoke and reissue.

**Q: How do students find credentials?**

A: They see them automatically in their wallet if issued to their address.

### For Verifiers

**Q: Can ZKPs be faked?**

A: No. Cryptographic proofs are mathematically verifiable. If verification succeeds, the proof is valid.

**Q: How long does verification take?**

A: Instant (< 1 second). Blockchain lookup is fast.

**Q: Do I need to trust the issuer?**

A: Yes. The system verifies the credential is authentic, but you decide if you trust the issuing institution.

## Support

### Help Resources

- **Documentation**: https://docs.anonhire.com
- **Video Tutorials**: https://youtube.com/anonhire
- **Community Forum**: https://forum.anonhire.com
- **Discord**: https://discord.gg/anonhire

### Contact Support

- **Email**: support@anonhire.com
- **Live Chat**: Available on website
- **Response Time**: 24-48 hours

### Report Issues

- **GitHub**: https://github.com/anonhire/issues
- **Bug Bounty**: security@anonhire.com

## Best Practices

### Security

1. ✅ Use hardware wallet for large amounts
2. ✅ Verify URLs before connecting wallet
3. ✅ Never share private keys or seed phrase
4. ✅ Use strong password for MetaMask
5. ✅ Enable 2FA where possible

### Privacy

1. ✅ Use ZKPs for sensitive information
2. ✅ Only share what's necessary
3. ✅ Use different addresses for different purposes
4. ✅ Review what you're sharing before sending

### Credentialing

1. ✅ Request credentials immediately after graduation/employment
2. ✅ Verify credentials are correct
3. ✅ Organize credentials with tags
4. ✅ Keep backup of important credential hashes

## Glossary

- **DID**: Decentralized Identifier - your blockchain identity
- **IPFS**: InterPlanetary File System - decentralized storage
- **ZKP**: Zero-Knowledge Proof - privacy-preserving proof
- **Gas**: Transaction fee on blockchain
- **Hash**: Unique fingerprint of data
- **Wallet**: Your blockchain account (like a bank account)
- **Smart Contract**: Self-executing code on blockchain

## What's Next?

Explore:
- [API Documentation](./API.md) for developers
- [Technical Architecture](./CONTRACTS.md) for deep dive
- [Deployment Guide](./DEPLOYMENT.md) for running your own instance

Welcome to the future of privacy-preserving credentials! 🚀


