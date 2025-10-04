const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const { promisify } = require("util");

const execAsync = promisify(exec);

const circuits = ["gpa_proof", "experience_proof"];
const buildDir = path.join(__dirname, "..", "build");
const ptauFile = path.join(buildDir, "powersOfTau28_hez_final_12.ptau");

async function setupCircuitKeys(circuitName) {
  console.log(`\n=== Setting up keys for ${circuitName} ===`);
  
  const circuitDir = path.join(buildDir, circuitName);
  const r1csFile = path.join(circuitDir, `${circuitName}.r1cs`);
  const zkeyFile = path.join(circuitDir, `${circuitName}_final.zkey`);
  const vkeyFile = path.join(circuitDir, `verification_key.json`);
  
  if (!fs.existsSync(r1csFile)) {
    throw new Error(`R1CS file not found for ${circuitName}. Please run compile first.`);
  }
  
  try {
    // Generate zkey (Phase 1)
    console.log("Generating zkey...");
    const zkeyInitFile = path.join(circuitDir, `${circuitName}_0000.zkey`);
    await execAsync(
      `snarkjs groth16 setup ${r1csFile} ${ptauFile} ${zkeyInitFile}`
    );
    
    // Contribute to ceremony (Phase 2)
    console.log("Contributing to ceremony...");
    const zkeyContribFile = path.join(circuitDir, `${circuitName}_0001.zkey`);
    await execAsync(
      `snarkjs zkey contribute ${zkeyInitFile} ${zkeyContribFile} --name="First contribution" -v -e="random entropy"`
    );
    
    // Finalize zkey
    console.log("Finalizing zkey...");
    await execAsync(
      `snarkjs zkey beacon ${zkeyContribFile} ${zkeyFile} 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"`
    );
    
    // Export verification key
    console.log("Exporting verification key...");
    await execAsync(
      `snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`
    );
    
    // Clean up intermediate files
    fs.unlinkSync(zkeyInitFile);
    fs.unlinkSync(zkeyContribFile);
    
    console.log(`✓ Keys generated successfully for ${circuitName}`);
    console.log(`  - zkey: ${zkeyFile}`);
    console.log(`  - vkey: ${vkeyFile}`);
    
  } catch (error) {
    console.error(`Error setting up keys for ${circuitName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("=== Setting up ZKP Circuit Keys ===");
  
  // Check if ptau file exists
  if (!fs.existsSync(ptauFile)) {
    console.error("\n❌ Error: Powers of Tau file not found");
    console.error("Please run 'npm run setup:ptau' first");
    process.exit(1);
  }
  
  // Setup keys for all circuits
  for (const circuit of circuits) {
    await setupCircuitKeys(circuit);
  }
  
  console.log("\n✓ All circuit keys generated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Key setup failed:", error);
    process.exit(1);
  });


