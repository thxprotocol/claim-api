import express from 'express';
import healthRouter from './health/health.router';
import claimRouter from './claims/claims.router';
import docsRouter from './docs/docs.router';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/claims', claimRouter)
router.use('/docs', docsRouter);

export default router;
