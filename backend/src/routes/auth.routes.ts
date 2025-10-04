import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with Ethereum address
 * @access  Public
 */
router.post(
  '/login',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  authController.login
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('role').isIn(['UNIVERSITY', 'EMPLOYER', 'INTERNSHIP_PROVIDER', 'CANDIDATE', 'VERIFIER']).withMessage('Invalid role'),
    body('email').optional().isEmail().withMessage('Invalid email'),
  ],
  validate,
  authController.register
);

/**
 * @route   GET /api/v1/auth/nonce/:address
 * @desc    Get nonce for signing
 * @access  Public
 */
router.get('/nonce/:address', authController.getNonce);

export default router;


