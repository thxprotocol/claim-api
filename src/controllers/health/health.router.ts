import express from 'express';
import { ReadHealthController } from './get.controller';

const router = express.Router();
router.get('/', ReadHealthController);

export default router;
