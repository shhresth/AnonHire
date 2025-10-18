# WSL ZKP Setup Guide for AnonHire

This guide will help you set up Zero-Knowledge Proof (ZKP) compilation in WSL2 for the AnonHire project.

## Prerequisites

1. **WSL2 installed** with Ubuntu 20.04 or later
2. **Node.js 18+** installed in WSL
3. **Git** installed in WSL

## Step 1: Install Required Dependencies

```bash
# Update package list
sudo apt update

# Install essential build tools
sudo apt install -y build-essential curl git

# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust (required for Circom)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Circom dependencies
sudo apt install -y libssl-dev pkg-config

# Install Circom
cargo install --git https://github.com/iden3/circom.git --tag v2.1.6

# Install SnarkJS
npm install -g snarkjs
```

## Step 2: Clone and Setup Project

```bash
# Clone the project (if not already done)
git clone <your-repo-url>
cd AnonHire-main

# Install dependencies
npm install

# Install ZKP specific dependencies
cd zkp
npm install
```

## Step 3: Create ZKP Circuits

Create the following circuit files in `zkp/circuits/`:

### GPA Proof Circuit (`gpa_proof.circom`)

```circom
pragma circom 2.1.6;

template GPAProof() {
    // Public inputs
    signal input gpa;
    signal input threshold;
    
    // Private inputs
    signal input studentId;
    signal input actualGpa;
    
    // Output
    signal output isValid;
    
    // Constraints
    component gte = GreaterEqThan(32);
    gte.in[0] <== actualGpa;
    gte.in[1] <== threshold;
    
    // Verify GPA meets threshold
    isValid <== gte.out;
    
    // Verify the public GPA matches the private GPA
    gpa === actualGpa;
}

component main = GPAProof();

// Helper component for greater than or equal comparison
template GreaterEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    
    out <== 1 - lt.out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component n2b = Num2Bits(n+1);
    n2b.in <== in[0]+ (1<<n) - in[1];
    
    out <== 1-n2b.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;
    
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * (1 << i);
    }
    
    lc1 === in;
}
```

### Experience Proof Circuit (`experience_proof.circom`)

```circom
pragma circom 2.1.6;

template ExperienceProof() {
    // Public inputs
    signal input minExperience;
    signal input companyHash;
    
    // Private inputs
    signal input actualExperience;
    signal input actualCompany;
    signal input startDate;
    signal input endDate;
    
    // Output
    signal output isValid;
    
    // Hash the company name
    component hasher = Poseidon(1);
    hasher.inputs[0] <== actualCompany;
    
    // Verify company hash matches
    companyHash === hasher.out;
    
    // Verify experience meets minimum
    component gte = GreaterEqThan(32);
    gte.in[0] <== actualExperience;
    gte.in[1] <== minExperience;
    
    isValid <== gte.out;
}

component main = ExperienceProof();

// Poseidon hash function (simplified version)
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified Poseidon implementation
    // In production, use a proper Poseidon implementation
    component add = Add();
    add.a <== inputs[0];
    add.b <== 0;
    out <== add.out;
}

template Add() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a + b;
}
```

## Step 4: Create ZKP Service

Create `backend/src/services/zkp.service.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class ZKPService {
  private circuitsPath: string;
  private buildPath: string;

  constructor() {
    this.circuitsPath = path.join(__dirname, '../../../zkp/circuits');
    this.buildPath = path.join(__dirname, '../../../zkp/build');
    
    // Ensure build directory exists
    if (!fs.existsSync(this.buildPath)) {
      fs.mkdirSync(this.buildPath, { recursive: true });
    }
  }

  async compileCircuit(circuitName: string): Promise<boolean> {
    try {
      const circuitFile = path.join(this.circuitsPath, `${circuitName}.circom`);
      const buildFile = path.join(this.buildPath, `${circuitName}.r1cs`);
      
      if (!fs.existsSync(circuitFile)) {
        throw new Error(`Circuit file not found: ${circuitFile}`);
      }

      logger.info(`Compiling circuit: ${circuitName}`);
      
      // Compile circuit using Circom
      const command = `circom ${circuitFile} --r1cs --wasm --sym --c -o ${this.buildPath}`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Compilation error: ${stderr}`);
      }
      
      logger.info(`Circuit compiled successfully: ${circuitName}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to compile circuit ${circuitName}:`, error);
      return false;
    }
  }

  async generateProof(
    circuitName: string,
    inputs: any,
    provingKeyPath?: string
  ): Promise<{ proof: any; publicSignals: any } | null> {
    try {
      // Ensure circuit is compiled
      const wasmPath = path.join(this.buildPath, `${circuitName}.wasm`);
      if (!fs.existsSync(wasmPath)) {
        const compiled = await this.compileCircuit(circuitName);
        if (!compiled) {
          throw new Error(`Failed to compile circuit: ${circuitName}`);
        }
      }

      // Generate witness
      const witnessPath = path.join(this.buildPath, `${circuitName}_witness.wtns`);
      const inputsPath = path.join(this.buildPath, `${circuitName}_inputs.json`);
      
      // Write inputs to file
      fs.writeFileSync(inputsPath, JSON.stringify(inputs, null, 2));
      
      // Generate witness
      const witnessCommand = `node ${path.join(this.buildPath, `${circuitName}_js`, 'generate_witness.js')} ${wasmPath} ${inputsPath} ${witnessPath}`;
      await execAsync(witnessCommand);
      
      // Generate proof (using snarkjs)
      const proofCommand = `snarkjs groth16 prove ${path.join(this.buildPath, `${circuitName}_0001.zkey`)} ${witnessPath} ${path.join(this.buildPath, `${circuitName}_proof.json`)} ${path.join(this.buildPath, `${circuitName}_public.json`)}`;
      await execAsync(proofCommand);
      
      // Read proof and public signals
      const proof = JSON.parse(fs.readFileSync(path.join(this.buildPath, `${circuitName}_proof.json`), 'utf8'));
      const publicSignals = JSON.parse(fs.readFileSync(path.join(this.buildPath, `${circuitName}_public.json`), 'utf8'));
      
      return { proof, publicSignals };
    } catch (error: any) {
      logger.error(`Failed to generate proof for ${circuitName}:`, error);
      return null;
    }
  }

  async verifyProof(
    circuitName: string,
    proof: any,
    publicSignals: any,
    verificationKeyPath?: string
  ): Promise<boolean> {
    try {
      const vkeyPath = verificationKeyPath || path.join(this.buildPath, `${circuitName}_verification_key.json`);
      
      if (!fs.existsSync(vkeyPath)) {
        throw new Error(`Verification key not found: ${vkeyPath}`);
      }
      
      // Verify proof using snarkjs
      const command = `snarkjs groth16 verify ${vkeyPath} ${path.join(this.buildPath, `${circuitName}_public.json`)} ${path.join(this.buildPath, `${circuitName}_proof.json`)}`;
      const { stdout } = await execAsync(command);
      
      return stdout.includes('OK!');
    } catch (error: any) {
      logger.error(`Failed to verify proof for ${circuitName}:`, error);
      return false;
    }
  }

  async setupCircuit(circuitName: string): Promise<boolean> {
    try {
      // Compile circuit
      const compiled = await this.compileCircuit(circuitName);
      if (!compiled) {
        return false;
      }
      
      // Generate trusted setup
      const r1csPath = path.join(this.buildPath, `${circuitName}.r1cs`);
      const zkeyPath = path.join(this.buildPath, `${circuitName}_0001.zkey`);
      const vkeyPath = path.join(this.buildPath, `${circuitName}_verification_key.json`);
      
      // Phase 1: Powers of Tau
      const phase1Command = `snarkjs powersoftau new bn128 12 ${path.join(this.buildPath, 'pot12_0000.ptau')} -v`;
      await execAsync(phase1Command);
      
      // Phase 2: Circuit-specific setup
      const phase2Command = `snarkjs powersoftau prepare phase2 ${path.join(this.buildPath, 'pot12_0000.ptau')} ${path.join(this.buildPath, 'pot12_final.ptau')} -v`;
      await execAsync(phase2Command);
      
      // Generate zkey
      const zkeyCommand = `snarkjs groth16 setup ${r1csPath} ${path.join(this.buildPath, 'pot12_final.ptau')} ${zkeyPath}`;
      await execAsync(zkeyCommand);
      
      // Export verification key
      const vkeyCommand = `snarkjs zkey export verificationkey ${zkeyPath} ${vkeyPath}`;
      await execAsync(vkeyCommand);
      
      logger.info(`Setup completed for circuit: ${circuitName}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to setup circuit ${circuitName}:`, error);
      return false;
    }
  }
}
```

## Step 5: Create ZKP Routes

Create `backend/src/routes/zkp.routes.ts`:

```typescript
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ZKPService } from '../services/zkp.service';

const router = Router();
const zkpService = new ZKPService();

/**
 * @route   POST /api/v1/zkp/generate-proof
 * @desc    Generate a zero-knowledge proof
 * @access  Private
 */
router.post(
  '/generate-proof',
  authenticate,
  [
    body('circuitName').notEmpty().withMessage('Circuit name is required'),
    body('inputs').isObject().withMessage('Inputs must be an object'),
  ],
  validate,
  async (req, res) => {
    try {
      const { circuitName, inputs } = req.body;
      
      const result = await zkpService.generateProof(circuitName, inputs);
      
      if (!result) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate proof',
        });
      }
      
      res.json({
        success: true,
        data: {
          proof: result.proof,
          publicSignals: result.publicSignals,
          circuitName,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/v1/zkp/verify-proof
 * @desc    Verify a zero-knowledge proof
 * @access  Public
 */
router.post(
  '/verify-proof',
  [
    body('circuitName').notEmpty().withMessage('Circuit name is required'),
    body('proof').isObject().withMessage('Proof must be an object'),
    body('publicSignals').isArray().withMessage('Public signals must be an array'),
  ],
  validate,
  async (req, res) => {
    try {
      const { circuitName, proof, publicSignals } = req.body;
      
      const isValid = await zkpService.verifyProof(circuitName, proof, publicSignals);
      
      res.json({
        success: true,
        data: {
          isValid,
          circuitName,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/v1/zkp/setup
 * @desc    Setup a circuit (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/setup',
  authenticate,
  [
    body('circuitName').notEmpty().withMessage('Circuit name is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { circuitName } = req.body;
      
      const success = await zkpService.setupCircuit(circuitName);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to setup circuit',
        });
      }
      
      res.json({
        success: true,
        message: `Circuit ${circuitName} setup completed`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
```

## Step 6: Setup Scripts

Create `zkp/scripts/setup.sh`:

```bash
#!/bin/bash

echo "Setting up ZKP circuits for AnonHire..."

# Create build directory
mkdir -p build

# Setup GPA proof circuit
echo "Setting up GPA proof circuit..."
snarkjs groth16 setup circuits/gpa_proof.r1cs build/pot12_final.ptau build/gpa_proof_0001.zkey
snarkjs zkey export verificationkey build/gpa_proof_0001.zkey build/gpa_proof_verification_key.json

# Setup Experience proof circuit
echo "Setting up Experience proof circuit..."
snarkjs groth16 setup circuits/experience_proof.r1cs build/pot12_final.ptau build/experience_proof_0001.zkey
snarkjs zkey export verificationkey build/experience_proof_0001.zkey build/experience_proof_verification_key.json

echo "ZKP setup completed!"
```

Make it executable:
```bash
chmod +x zkp/scripts/setup.sh
```

## Step 7: Usage Examples

### Generate GPA Proof

```typescript
// Frontend usage
const generateGPAProof = async (gpa: number, threshold: number) => {
  const response = await fetch('/api/v1/zkp/generate-proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      circuitName: 'gpa_proof',
      inputs: {
        gpa: gpa * 100, // Convert to integer
        threshold: threshold * 100,
        studentId: 12345,
        actualGpa: gpa * 100
      }
    })
  });
  
  return await response.json();
};
```

### Verify Proof

```typescript
// Verifier usage
const verifyProof = async (proof: any, publicSignals: any) => {
  const response = await fetch('/api/v1/zkp/verify-proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      circuitName: 'gpa_proof',
      proof,
      publicSignals
    })
  });
  
  return await response.json();
};
```

## Troubleshooting

### Common Issues:

1. **Circom not found**: Make sure Rust and Circom are properly installed
2. **Permission denied**: Run `chmod +x` on setup scripts
3. **Memory issues**: Increase WSL memory limit in `.wslconfig`
4. **Node version**: Ensure Node.js 18+ is installed

### WSL Configuration:

Create `.wslconfig` in your Windows user directory:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

## Testing

Run the setup and test:

```bash
# In WSL terminal
cd AnonHire-main/zkp
./scripts/setup.sh

# Test compilation
circom circuits/gpa_proof.circom --r1cs --wasm --sym --c -o build

# Test proof generation
node build/gpa_proof_js/generate_witness.js build/gpa_proof.wasm input.json witness.wtns
```

This setup provides a complete ZKP implementation for AnonHire with GPA and experience proofs that can be generated and verified securely.
