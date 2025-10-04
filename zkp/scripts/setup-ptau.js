const path = require("path");
const https = require("https");
const fs = require("fs");

const buildDir = path.join(__dirname, "..", "build");
const ptauFile = path.join(buildDir, "powersOfTau28_hez_final_12.ptau");
const ptauUrl = "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau";

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    console.log(`Downloading Powers of Tau file...`);
    console.log(`This may take a few minutes (file size: ~50MB)`);
    
    https.get(url, (response) => {
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      let lastProgress = 0;
      
      response.pipe(file);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = Math.floor((downloadedSize / totalSize) * 100);
        
        if (progress >= lastProgress + 10) {
          console.log(`Progress: ${progress}%`);
          lastProgress = progress;
        }
      });
      
      file.on('finish', () => {
        file.close();
        console.log('✓ Download completed successfully');
        resolve();
      });
      
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("=== Setting up Powers of Tau ===\n");
  
  // Create build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(ptauFile)) {
    console.log("Powers of Tau file already exists. Skipping download.");
    console.log(`File: ${ptauFile}`);
    return;
  }
  
  try {
    await downloadFile(ptauUrl, ptauFile);
    console.log(`\nPowers of Tau file saved to: ${ptauFile}`);
  } catch (error) {
    console.error("\n❌ Error downloading Powers of Tau file:", error.message);
    console.error("\nYou can manually download it from:");
    console.error(ptauUrl);
    console.error(`And save it to: ${ptauFile}`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });


