const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const { promisify } = require("util");

const execAsync = promisify(exec);

const circuits = [
  { name: "gpa_proof", file: "gpa_proof.circom" },
  { name: "experience_proof", file: "experience_proof.circom" }
];

const circuitsDir = path.join(__dirname, "..", "circuits");
const buildDir = path.join(__dirname, "..", "build");

async function compileCircuit(circuitName, circuitFile) {
  console.log(`\nCompiling ${circuitName}...`);
  
  const circuitPath = path.join(circuitsDir, circuitFile);
  const outputDir = path.join(buildDir, circuitName);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Compile circuit
    const compileCmd = `circom2 ${circuitPath} --r1cs --wasm --sym -o ${outputDir} -l ../node_modules`;
    console.log(`Running: ${compileCmd}`);
    
    const { stdout, stderr } = await execAsync(compileCmd);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✓ ${circuitName} compiled successfully`);
    
    // Display circuit info
    const r1csFile = path.join(outputDir, `${circuitName}.r1cs`);
    if (fs.existsSync(r1csFile)) {
      const infoCmd = `snarkjs r1cs info ${r1csFile}`;
      const { stdout: infoOut } = await execAsync(infoCmd);
      console.log(infoOut);
    }
    
  } catch (error) {
    console.error(`Error compiling ${circuitName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("=== Compiling ZKP Circuits ===");
  
  // Create build directory
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Check if circom2 is installed
  try {
    await execAsync("circom2 --version");
  } catch (error) {
    console.error("\n❌ Error: circom2 is not installed");
    console.error("Please install circom2 from: https://docs.circom.io/getting-started/installation/");
    process.exit(1);
  }
  
  // Compile all circuits
  for (const circuit of circuits) {
    await compileCircuit(circuit.name, circuit.file);
  }
  
  console.log("\n✓ All circuits compiled successfully!");
  console.log(`Output directory: ${buildDir}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Compilation failed:", error);
    process.exit(1);
  });


