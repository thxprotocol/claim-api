import express from 'express';
import healthRouter from './health/health.router';
import docsRouter from './docs/docs.router';
import holderRouter from './holder/holder.router';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/docs', docsRouter);
router.use('/holder', holderRouter)
// router.use('/members', membersRouter);

export default router;
