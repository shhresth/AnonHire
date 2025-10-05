import { ethers } from "hardhat";

async function main() {
  const vcAddr = process.env.CONTRACT_VERIFIABLE_CREDENTIAL as string;
  const target = process.env.GRANT_ISSUER_ADDRESS as string;

  if (!vcAddr || !target) {
    throw new Error("Missing CONTRACT_VERIFIABLE_CREDENTIAL or GRANT_ISSUER_ADDRESS env vars");
  }

  console.log("Granting ISSUER_ROLE on", vcAddr, "to", target);
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", await signer.getAddress());

  const vc = await ethers.getContractAt("VerifiableCredential", vcAddr, signer);
  const ISSUER_ROLE = await vc.ISSUER_ROLE();

  const has = await vc.hasRole(ISSUER_ROLE, target);
  if (has) {
    console.log("Target already has ISSUER_ROLE. Nothing to do.");
    return;
  }

  const tx = await vc.grantRole(ISSUER_ROLE, target);
  console.log("Tx submitted:", tx.hash);
  await tx.wait();
  console.log("✅ ISSUER_ROLE granted to", target);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


