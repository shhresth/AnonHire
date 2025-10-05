import { ethers } from "hardhat";

async function main() {
  const vcAddr = process.env.CONTRACT_VERIFIABLE_CREDENTIAL as string;
  const didAddr = process.env.CONTRACT_DID_REGISTRY as string;
  const issuer = process.env.GRANT_ISSUER_ADDRESS as string;

  if (!vcAddr || !didAddr || !issuer) {
    throw new Error("Missing CONTRACT_VERIFIABLE_CREDENTIAL, CONTRACT_DID_REGISTRY or GRANT_ISSUER_ADDRESS env vars");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", await signer.getAddress());

  const vc = await ethers.getContractAt("VerifiableCredential", vcAddr, signer);
  const did = await ethers.getContractAt("DIDRegistry", didAddr, signer);

  // Unpause if paused
  const paused = await vc.paused();
  console.log("VC paused:", paused);
  if (paused) {
    const tx = await vc.unpause();
    console.log("Unpause tx:", tx.hash);
    await tx.wait();
    console.log("✅ Unpaused VC");
  }

  // Register DID for issuer if needed
  try {
    const doc = await did.resolveDID(issuer);
    console.log("DID resolve result:", doc);
  } catch {
    console.log("Registering DID for issuer:", issuer);
    const tx = await did.registerDID(
      `did:ethr:${issuer}`,
      "-----BEGIN PUBLIC KEY-----\\nDEV-KEY\\n-----END PUBLIC KEY-----",
      "https://example.com/did-service"
    );
    console.log("RegisterDID tx:", tx.hash);
    await tx.wait();
    console.log("✅ DID registered for issuer");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


