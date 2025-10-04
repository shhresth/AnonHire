# Zero-Knowledge Proof Circuits

This directory contains Circom circuits for privacy-preserving credential verification.

## Circuits

### 1. GPA Proof (`gpa_proof.circom`)
Proves that a candidate's GPA is greater than or equal to a threshold without revealing the actual GPA.

**Use Case**: A recruiter requires candidates with GPA ≥ 3.5, but the candidate doesn't want to share their full transcript.

**Inputs**:
- Private: `gpa` (scaled by 100), `salt`, `credentialHash`
- Public: `threshold`, `expectedCommitment`

**Output**: `valid` (1 if GPA ≥ threshold, 0 otherwise)

### 2. Experience Proof (`experience_proof.circom`)
Proves that a candidate has at least X months of work experience without revealing exact duration or job details.

**Use Case**: A company requires 3+ years of experience, but the candidate wants to keep their job history private.

**Inputs**:
- Private: `experienceMonths`, `salt`, `credentialHash`
- Public: `requiredMonths`, `expectedCommitment`

**Output**: `valid` (1 if experience ≥ required, 0 otherwise)

## Setup

### Prerequisites
```bash
# Install Circom
# Follow instructions at: https://docs.circom.io/getting-started/installation/

# For Ubuntu/Debian:
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Install Node dependencies
npm install
```

### Compile Circuits and Generate Keys
```bash
# Download Powers of Tau (one-time setup)
npm run setup:ptau

# Compile circuits
npm run compile

# Generate proving and verification keys
npm run setup:keys

# Or run all steps at once
npm run setup
```

## Usage

### Generate a Proof

```javascript
const snarkjs = require("snarkjs");
const fs = require("fs");

// Example: GPA Proof
const input = {
  gpa: 375,              // 3.75 GPA (scaled by 100)
  threshold: 350,         // Required 3.5 GPA
  salt: 12345,           // Random salt
  credentialHash: "0x...",
  expectedCommitment: "..." // Poseidon hash of (gpa, salt, credentialHash)
};

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  input,
  "build/gpa_proof/gpa_proof_js/gpa_proof.wasm",
  "build/gpa_proof/gpa_proof_final.zkey"
);

// Save proof
fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
fs.writeFileSync("public.json", JSON.stringify(publicSignals, null, 2));
```

### Verify a Proof

```javascript
const vKey = JSON.parse(
  fs.readFileSync("build/gpa_proof/verification_key.json")
);

const proof = JSON.parse(fs.readFileSync("proof.json"));
const publicSignals = JSON.parse(fs.readFileSync("public.json"));

const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
console.log("Proof valid:", isValid);
```

### Integration with Smart Contracts

The verification keys can be exported to Solidity for on-chain verification:

```bash
snarkjs zkey export solidityverifier \
  build/gpa_proof/gpa_proof_final.zkey \
  ../contracts/src/GPAVerifier.sol
```

## Testing

```bash
npm test
```

## Circuit Parameters

| Circuit | Constraints | Private Inputs | Public Inputs |
|---------|-------------|----------------|---------------|
| GPA Proof | ~50 | 3 | 2 |
| Experience Proof | ~50 | 3 | 2 |

## Security Considerations

1. **Salt Generation**: Always use cryptographically secure random salts
2. **Commitment Storage**: Store commitments securely off-chain or on-chain
3. **Trusted Setup**: The Powers of Tau ceremony must be trusted
4. **Circuit Auditing**: Circuits should be audited before production use
5. **Input Validation**: Validate all inputs before proof generation

## Future Enhancements

- Age verification circuit
- Multi-credential aggregation proofs
- Biometric proofs (BioZero-style)
- Salary range proofs
- Skills certification proofs

## References

- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS](https://github.com/iden3/snarkjs)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)


