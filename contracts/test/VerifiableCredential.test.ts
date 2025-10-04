import { expect } from "chai";
import { ethers } from "hardhat";
import { DIDRegistry, RevocationRegistry, VerifiableCredential } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VerifiableCredential System", function () {
  let didRegistry: DIDRegistry;
  let revocationRegistry: RevocationRegistry;
  let verifiableCredential: VerifiableCredential;
  let admin: SignerWithAddress;
  let university: SignerWithAddress;
  let employer: SignerWithAddress;
  let student: SignerWithAddress;
  let verifier: SignerWithAddress;

  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  beforeEach(async function () {
    [admin, university, employer, student, verifier] = await ethers.getSigners();

    // Deploy DIDRegistry
    const DIDRegistryFactory = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistryFactory.deploy();
    await didRegistry.waitForDeployment();

    // Deploy RevocationRegistry
    const RevocationRegistryFactory = await ethers.getContractFactory("RevocationRegistry");
    revocationRegistry = await RevocationRegistryFactory.deploy();
    await revocationRegistry.waitForDeployment();

    // Deploy VerifiableCredential
    const VerifiableCredentialFactory = await ethers.getContractFactory("VerifiableCredential");
    verifiableCredential = await VerifiableCredentialFactory.deploy(
      await didRegistry.getAddress(),
      await revocationRegistry.getAddress()
    );
    await verifiableCredential.waitForDeployment();

    // Grant ISSUER_ROLE to VerifiableCredential in RevocationRegistry
    await revocationRegistry.grantRole(ISSUER_ROLE, await verifiableCredential.getAddress());

    // Register university as issuer
    await didRegistry.registerIssuer(
      university.address,
      `did:ethr:${university.address}`,
      "university-public-key",
      "https://university.example.com"
    );

    // Register employer as issuer
    await didRegistry.registerIssuer(
      employer.address,
      `did:ethr:${employer.address}`,
      "employer-public-key",
      "https://employer.example.com"
    );

    // Register student DID
    await didRegistry.connect(student).registerDID(
      `did:ethr:${student.address}`,
      "student-public-key",
      "https://student.example.com"
    );

    // Grant ISSUER_ROLE to university and employer in VerifiableCredential
    await verifiableCredential.grantRole(ISSUER_ROLE, university.address);
    await verifiableCredential.grantRole(ISSUER_ROLE, employer.address);
  });

  describe("DID Registry", function () {
    it("Should register a DID", async function () {
      const did = await didRegistry.resolveDID(student.address);
      expect(did.owner).to.equal(student.address);
      expect(did.isActive).to.be.true;
    });

    it("Should register an issuer", async function () {
      const hasDID = await didRegistry.hasDID(university.address);
      expect(hasDID).to.be.true;
    });

    it("Should prevent duplicate DID registration", async function () {
      await expect(
        didRegistry.connect(student).registerDID(
          `did:ethr:${student.address}`,
          "another-key",
          "https://another.com"
        )
      ).to.be.revertedWith("DID already registered");
    });
  });

  describe("Academic Credentials", function () {
    it("Should issue an academic credential", async function () {
      const ipfsHash = "QmTestHash123";
      const expiresAt = 0; // No expiration

      const tx = await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, ipfsHash, expiresAt);

      await expect(tx)
        .to.emit(verifiableCredential, "CredentialIssued")
        .withArgs(
          ethers.AnyValue,
          0, // CredentialType.ACADEMIC
          university.address,
          student.address,
          ipfsHash,
          ethers.AnyValue
        );
    });

    it("Should verify a valid academic credential", async function () {
      const ipfsHash = "QmTestHash123";
      const tx = await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, ipfsHash, 0);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return verifiableCredential.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });

      const parsedEvent = verifiableCredential.interface.parseLog(event!);
      const credentialHash = parsedEvent?.args[0];

      const isValid = await verifiableCredential.verifyCredential(credentialHash);
      expect(isValid).to.be.true;
    });

    it("Should get subject credentials", async function () {
      await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, "QmHash1", 0);

      await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, "QmHash2", 0);

      const credentials = await verifiableCredential.getSubjectCredentials(student.address);
      expect(credentials.length).to.equal(2);
    });
  });

  describe("Job Credentials", function () {
    it("Should issue a job credential", async function () {
      const ipfsHash = "QmJobHash456";
      const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

      await expect(
        verifiableCredential.connect(employer).issueJobVC(student.address, ipfsHash, expiresAt)
      )
        .to.emit(verifiableCredential, "CredentialIssued")
        .withArgs(
          ethers.AnyValue,
          1, // CredentialType.JOB
          employer.address,
          student.address,
          ipfsHash,
          ethers.AnyValue
        );
    });
  });

  describe("Internship Credentials", function () {
    it("Should issue an internship credential", async function () {
      const ipfsHash = "QmInternHash789";

      await expect(
        verifiableCredential.connect(employer).issueInternshipVC(student.address, ipfsHash, 0)
      )
        .to.emit(verifiableCredential, "CredentialIssued")
        .withArgs(
          ethers.AnyValue,
          2, // CredentialType.INTERNSHIP
          employer.address,
          student.address,
          ipfsHash,
          ethers.AnyValue
        );
    });
  });

  describe("Revocation", function () {
    it("Should revoke a credential", async function () {
      const ipfsHash = "QmRevokeTest";
      const tx = await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, ipfsHash, 0);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return verifiableCredential.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });

      const parsedEvent = verifiableCredential.interface.parseLog(event!);
      const credentialHash = parsedEvent?.args[0];

      await verifiableCredential.connect(university).revokeVC(credentialHash, "Test revocation");

      const isValid = await verifiableCredential.verifyCredential(credentialHash);
      expect(isValid).to.be.false;

      const isRevoked = await revocationRegistry.isRevoked(credentialHash);
      expect(isRevoked).to.be.true;
    });

    it("Should not allow non-issuer to revoke", async function () {
      const ipfsHash = "QmRevokeTest2";
      const tx = await verifiableCredential
        .connect(university)
        .issueAcademicVC(student.address, ipfsHash, 0);

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return verifiableCredential.interface.parseLog(log)?.name === "CredentialIssued";
        } catch {
          return false;
        }
      });

      const parsedEvent = verifiableCredential.interface.parseLog(event!);
      const credentialHash = parsedEvent?.args[0];

      await expect(
        verifiableCredential.connect(employer).revokeVC(credentialHash, "Unauthorized revocation")
      ).to.be.revertedWith("Not the issuer");
    });
  });

  describe("Statistics", function () {
    it("Should track credential statistics", async function () {
      await verifiableCredential.connect(university).issueAcademicVC(student.address, "QmHash1", 0);
      await verifiableCredential.connect(employer).issueJobVC(student.address, "QmHash2", 0);
      await verifiableCredential
        .connect(employer)
        .issueInternshipVC(student.address, "QmHash3", 0);

      const stats = await verifiableCredential.getStatistics();
      expect(stats.total).to.equal(3);
      expect(stats.academic).to.equal(1);
      expect(stats.job).to.equal(1);
      expect(stats.internship).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-issuers from issuing credentials", async function () {
      await expect(
        verifiableCredential.connect(student).issueAcademicVC(student.address, "QmHash", 0)
      ).to.be.reverted;
    });

    it("Should allow admin to pause contracts", async function () {
      await verifiableCredential.pause();
      await expect(
        verifiableCredential.connect(university).issueAcademicVC(student.address, "QmHash", 0)
      ).to.be.reverted;
    });
  });
});


