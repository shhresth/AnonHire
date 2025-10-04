import * as snarkjs from 'snarkjs';
import path from 'path';
import fs from 'fs';
import { buildPoseidon } from 'circomlibjs';
import { logger } from '../utils/logger';

export class ZKPService {
  private zkpDir: string;

  constructor() {
    this.zkpDir = path.join(__dirname, '../../../zkp/build');
  }

  /**
   * Generate a GPA proof
   */
  async generateGPAProof(input: {
    gpa: number;
    threshold: number;
    salt: bigint;
    credentialHash: bigint;
  }): Promise<{ proof: any; publicSignals: any }> {
    try {
      logger.info('Generating GPA proof');

      // Scale GPA values (multiply by 100)
      const scaledGPA = Math.floor(input.gpa * 100);
      const scaledThreshold = Math.floor(input.threshold * 100);

      // Generate commitment
      const poseidon = await buildPoseidon();
      const commitment = poseidon.F.toString(
        poseidon([BigInt(scaledGPA), input.salt, input.credentialHash])
      );

      // Prepare circuit inputs
      const circuitInput = {
        gpa: scaledGPA,
        salt: input.salt.toString(),
        credentialHash: input.credentialHash.toString(),
        threshold: scaledThreshold,
        expectedCommitment: commitment,
      };

      const wasmPath = path.join(this.zkpDir, 'gpa_proof', 'gpa_proof_js', 'gpa_proof.wasm');
      const zkeyPath = path.join(this.zkpDir, 'gpa_proof', 'gpa_proof_final.zkey');

      // Generate proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        wasmPath,
        zkeyPath
      );

      logger.info('GPA proof generated successfully');

      return { proof, publicSignals };
    } catch (error: any) {
      logger.error('Error generating GPA proof:', error);
      throw new Error(`GPA proof generation failed: ${error.message}`);
    }
  }

  /**
   * Generate an experience proof
   */
  async generateExperienceProof(input: {
    experienceMonths: number;
    requiredMonths: number;
    salt: bigint;
    credentialHash: bigint;
  }): Promise<{ proof: any; publicSignals: any }> {
    try {
      logger.info('Generating experience proof');

      // Generate commitment
      const poseidon = await buildPoseidon();
      const commitment = poseidon.F.toString(
        poseidon([BigInt(input.experienceMonths), input.salt, input.credentialHash])
      );

      // Prepare circuit inputs
      const circuitInput = {
        experienceMonths: input.experienceMonths,
        salt: input.salt.toString(),
        credentialHash: input.credentialHash.toString(),
        requiredMonths: input.requiredMonths,
        expectedCommitment: commitment,
      };

      const wasmPath = path.join(
        this.zkpDir,
        'experience_proof',
        'experience_proof_js',
        'experience_proof.wasm'
      );
      const zkeyPath = path.join(this.zkpDir, 'experience_proof', 'experience_proof_final.zkey');

      // Generate proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        wasmPath,
        zkeyPath
      );

      logger.info('Experience proof generated successfully');

      return { proof, publicSignals };
    } catch (error: any) {
      logger.error('Error generating experience proof:', error);
      throw new Error(`Experience proof generation failed: ${error.message}`);
    }
  }

  /**
   * Verify a GPA proof
   */
  async verifyGPAProof(proof: any, publicSignals: any): Promise<boolean> {
    try {
      logger.info('Verifying GPA proof');

      const vkeyPath = path.join(this.zkpDir, 'gpa_proof', 'verification_key.json');
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

      const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

      logger.info(`GPA proof verification result: ${isValid}`);

      return isValid;
    } catch (error: any) {
      logger.error('Error verifying GPA proof:', error);
      return false;
    }
  }

  /**
   * Verify an experience proof
   */
  async verifyExperienceProof(proof: any, publicSignals: any): Promise<boolean> {
    try {
      logger.info('Verifying experience proof');

      const vkeyPath = path.join(this.zkpDir, 'experience_proof', 'verification_key.json');
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

      const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

      logger.info(`Experience proof verification result: ${isValid}`);

      return isValid;
    } catch (error: any) {
      logger.error('Error verifying experience proof:', error);
      return false;
    }
  }

  /**
   * Generate commitment for a credential
   */
  async generateCommitment(value: bigint, salt: bigint, credentialHash: bigint): Promise<string> {
    try {
      const poseidon = await buildPoseidon();
      const commitment = poseidon.F.toString(poseidon([value, salt, credentialHash]));
      return commitment;
    } catch (error: any) {
      logger.error('Error generating commitment:', error);
      throw new Error(`Commitment generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a random salt
   */
  generateSalt(): bigint {
    const randomBytes = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
    return BigInt('0x' + randomBytes.toString('hex'));
  }
}


