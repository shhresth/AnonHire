import { Router } from 'express';
import authRoutes from './auth.routes';
import credentialRoutes from './credential.routes';
import verificationRoutes from './verification.routes';
import zkpRoutes from './zkp.routes';
import mockZkpRoutes from './mock-zkp.routes';
import didRoutes from './did.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/credentials', credentialRoutes);
router.use('/verification', verificationRoutes);
router.use('/zkp', zkpRoutes);
router.use('/zkp', mockZkpRoutes); // Mock ZKP routes (will override some endpoints)
router.use('/did', didRoutes);

export default router;


