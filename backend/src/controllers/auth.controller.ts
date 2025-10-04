import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Store nonces temporarily (in production, use Redis)
const nonces = new Map<string, string>();

/**
 * Get nonce for signing
 */
export const getNonce = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address } = req.params;

    // Validate address
    if (!ethers.isAddress(address)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address',
      });
      return;
    }

    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    nonces.set(address.toLowerCase(), nonce);

    // Clean up old nonces after 5 minutes
    setTimeout(() => nonces.delete(address.toLowerCase()), 5 * 60 * 1000);

    res.json({
      success: true,
      data: { nonce },
    });
  } catch (error: any) {
    logger.error('Error generating nonce:', error);
    next(error);
  }
};

/**
 * Login with Ethereum signature
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address, signature, message } = req.body;

    const normalizedAddress = address.toLowerCase();

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
      return;
    }

    // Check if nonce matches
    const expectedNonce = nonces.get(normalizedAddress);
    if (!expectedNonce || !message.includes(expectedNonce)) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired nonce',
      });
      return;
    }

    // Remove used nonce
    nonces.delete(normalizedAddress);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: normalizedAddress },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      address: user.address,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          address: user.address,
          role: user.role,
          did: user.did,
        },
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * Register new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address, role, email } = req.body;

    const normalizedAddress = address.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { address: normalizedAddress },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already registered',
      });
      return;
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        address: normalizedAddress,
        role,
        email,
      },
    });

    logger.info(`New user registered: ${user.address} with role ${user.role}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    next(error);
  }
};

