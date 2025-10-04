import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy DIDRegistry
  console.log("Deploying DIDRegistry...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddress = await didRegistry.getAddress();
  console.log("DIDRegistry deployed to:", didRegistryAddress);

  // Deploy RevocationRegistry
  console.log("\nDeploying RevocationRegistry...");
  const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy();
  await revocationRegistry.waitForDeployment();
  const revocationRegistryAddress = await revocationRegistry.getAddress();
  console.log("RevocationRegistry deployed to:", revocationRegistryAddress);

  // Deploy VerifiableCredential
  console.log("\nDeploying VerifiableCredential...");
  const VerifiableCredential = await ethers.getContractFactory("VerifiableCredential");
  const verifiableCredential = await VerifiableCredential.deploy(
    didRegistryAddress,
    revocationRegistryAddress
  );
  await verifiableCredential.waitForDeployment();
  const verifiableCredentialAddress = await verifiableCredential.getAddress();
  console.log("VerifiableCredential deployed to:", verifiableCredentialAddress);

  // Grant ISSUER_ROLE to RevocationRegistry in DIDRegistry
  console.log("\nConfiguring roles...");
  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
  
  // Grant roles to VerifiableCredential contract
  await revocationRegistry.grantRole(ISSUER_ROLE, verifiableCredentialAddress);
  console.log("Granted ISSUER_ROLE to VerifiableCredential in RevocationRegistry");

  console.log("\n=== Deployment Summary ===");
  console.log("DIDRegistry:", didRegistryAddress);
  console.log("RevocationRegistry:", revocationRegistryAddress);
  console.log("VerifiableCredential:", verifiableCredentialAddress);
  console.log("\nSave these addresses to your .env file:");
  console.log(`CONTRACT_DID_REGISTRY=${didRegistryAddress}`);
  console.log(`CONTRACT_REVOCATION_REGISTRY=${revocationRegistryAddress}`);
  console.log(`CONTRACT_VERIFIABLE_CREDENTIAL=${verifiableCredentialAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


