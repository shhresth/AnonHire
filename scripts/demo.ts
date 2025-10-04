/**
 * Demo Script - Complete Workflow
 * Demonstrates the full credential lifecycle:
 * 1. Fresher with GPA proof
 * 2. Experienced candidate with experience proof
 * 3. Credential revocation scenario
 */

import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Demo accounts
const UNIVERSITY_PRIVATE_KEY = process.env.UNIVERSITY_PRIVATE_KEY!;
const EMPLOYER_PRIVATE_KEY = process.env.EMPLOYER_PRIVATE_KEY!;
const STUDENT_PRIVATE_KEY = process.env.STUDENT_PRIVATE_KEY!;

async function main() {
  console.log('=== AnonHire Demo Scenarios ===\n');

  // Scenario 1: Fresher with GPA proof
  await scenario1();

  // Scenario 2: Experienced candidate
  await scenario2();

  // Scenario 3: Credential revocation
  await scenario3();
}

async function scenario1() {
  console.log('\n=== Scenario 1: Fresher applies for job with GPA proof ===');

  const university = new ethers.Wallet(UNIVERSITY_PRIVATE_KEY, provider);
  const student = new ethers.Wallet(STUDENT_PRIVATE_KEY, provider);

  console.log('\n1. University issues academic credential...');
  
  const academicCredential = {
    subjectAddress: student.address,
    studentName: 'Alice Johnson',
    degree: 'Bachelor of Science',
    major: 'Computer Science',
    gpa: 3.75,
    graduationYear: 2023,
    institutionName: 'MIT',
  };

  try {
    const response = await axios.post(
      `${API_URL}/credentials/academic`,
      academicCredential,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(university.address)}`,
        },
      }
    );

    console.log('✓ Academic credential issued');
    console.log('  Credential Hash:', response.data.data.credentialHash);
    console.log('  IPFS Hash:', response.data.data.ipfsHash);
    console.log('  Transaction Hash:', response.data.data.txHash);

    const credentialHash = response.data.data.credentialHash;

    // 2. Student generates ZKP for GPA ≥ 3.5
    console.log('\n2. Student generates ZKP to prove GPA ≥ 3.5...');

    const zkpResponse = await axios.post(
      `${API_URL}/zkp/gpa/generate`,
      {
        gpa: 3.75,
        threshold: 3.5,
        credentialHash,
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(student.address)}`,
        },
      }
    );

    console.log('✓ ZKP generated successfully');
    console.log('  Proof type: GPA >= 3.5');
    console.log('  Without revealing actual GPA');

    // 3. Recruiter verifies the proof
    console.log('\n3. Recruiter verifies the proof...');

    const verifyResponse = await axios.post(
      `${API_URL}/zkp/gpa/verify`,
      {
        proof: zkpResponse.data.data.proof,
        publicSignals: zkpResponse.data.data.publicSignals,
        credentialId: response.data.data.credentialId,
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(student.address)}`,
        },
      }
    );

    console.log('✓ Proof verified:', verifyResponse.data.data.isValid);
    console.log('  Candidate meets GPA requirement without revealing transcript');

  } catch (error: any) {
    console.error('Error in Scenario 1:', error.response?.data || error.message);
  }
}

async function scenario2() {
  console.log('\n\n=== Scenario 2: Experienced candidate with experience proof ===');

  const employer = new ethers.Wallet(EMPLOYER_PRIVATE_KEY, provider);
  const candidate = new ethers.Wallet(STUDENT_PRIVATE_KEY, provider);

  console.log('\n1. Previous employer issues job credential...');

  const jobCredential = {
    subjectAddress: candidate.address,
    employeeName: 'Bob Smith',
    position: 'Software Engineer',
    startDate: '2020-01-15',
    endDate: '2023-06-30',
    experienceMonths: 42, // 3.5 years
    companyName: 'Tech Corp',
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  };

  try {
    const response = await axios.post(
      `${API_URL}/credentials/job`,
      jobCredential,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(employer.address)}`,
        },
      }
    );

    console.log('✓ Job credential issued');
    console.log('  Company:', jobCredential.companyName);
    console.log('  Experience: 42 months (3.5 years)');

    const credentialHash = response.data.data.credentialHash;

    // 2. Candidate generates ZKP for experience ≥ 36 months (3 years)
    console.log('\n2. Candidate generates ZKP to prove ≥3 years experience...');

    const zkpResponse = await axios.post(
      `${API_URL}/zkp/experience/generate`,
      {
        experienceMonths: 42,
        requiredMonths: 36,
        credentialHash,
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(candidate.address)}`,
        },
      }
    );

    console.log('✓ ZKP generated successfully');
    console.log('  Proof type: Experience >= 3 years');
    console.log('  Without revealing exact duration or company details');

    // 3. New employer verifies
    console.log('\n3. New employer verifies the proof...');

    const verifyResponse = await axios.post(
      `${API_URL}/zkp/experience/verify`,
      {
        proof: zkpResponse.data.data.proof,
        publicSignals: zkpResponse.data.data.publicSignals,
        credentialId: response.data.data.credentialId,
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(candidate.address)}`,
        },
      }
    );

    console.log('✓ Proof verified:', verifyResponse.data.data.isValid);
    console.log('  Candidate meets experience requirement');

  } catch (error: any) {
    console.error('Error in Scenario 2:', error.response?.data || error.message);
  }
}

async function scenario3() {
  console.log('\n\n=== Scenario 3: Credential Revocation ===');

  const university = new ethers.Wallet(UNIVERSITY_PRIVATE_KEY, provider);
  const student = new ethers.Wallet(STUDENT_PRIVATE_KEY, provider);

  console.log('\n1. University discovers fraudulent credential...');

  try {
    // Get a credential to revoke
    const credentials = await axios.get(
      `${API_URL}/credentials/issuer/${university.address}`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(university.address)}`,
        },
      }
    );

    if (credentials.data.data.length === 0) {
      console.log('No credentials to revoke');
      return;
    }

    const credentialId = credentials.data.data[0].id;

    // 2. University revokes the credential
    console.log('\n2. University revokes the credential...');

    await axios.post(
      `${API_URL}/credentials/${credentialId}/revoke`,
      {
        reason: 'Fraudulent information detected',
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(university.address)}`,
        },
      }
    );

    console.log('✓ Credential revoked on-chain');

    // 3. Verifier checks revocation status
    console.log('\n3. Verifier attempts to verify revoked credential...');

    const verifyResponse = await axios.post(
      `${API_URL}/verification/verify`,
      {
        credentialHash: credentials.data.data[0].credentialHash,
      },
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken(student.address)}`,
        },
      }
    );

    console.log('✓ Verification result:', verifyResponse.data.data.isValid);
    console.log('  Reason:', verifyResponse.data.data.reason || 'Credential revoked');
    console.log('  Revocation prevents fraudulent credential use');

  } catch (error: any) {
    console.error('Error in Scenario 3:', error.response?.data || error.message);
  }
}

async function getAuthToken(address: string): Promise<string> {
  // Simplified token generation (in production, use proper signature-based auth)
  // This is just for demo purposes
  return 'demo_token_' + address;
}

main()
  .then(() => {
    console.log('\n\n=== Demo completed successfully ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });


