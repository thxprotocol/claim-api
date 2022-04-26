import express from 'express';
import healthRouter from './health/health.router';
import docsRouter from './docs/docs.router';
import membersRouter from './members/members.router';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/docs', docsRouter);
// router.use('/members', membersRouter);

export default router;
