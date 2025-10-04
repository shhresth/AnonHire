import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as didController from '../controllers/did.controller';

const router = Router();

/**
 * @route   POST /api/v1/did/register
 * @desc    Register a DID
 * @access  Private
 */
router.post(
  '/register',
  authenticate,
  [
    body('did').notEmpty().withMessage('DID is required'),
    body('publicKeyPem').notEmpty().withMessage('Public key is required'),
    body('serviceEndpoint').optional().isURL().withMessage('Invalid service endpoint'),
  ],
  validate,
  didController.registerDID
);

/**
 * @route   GET /api/v1/did/:address
 * @desc    Resolve DID by address
 * @access  Public
 */
router.get('/:address', didController.resolveDID);

export default router;


