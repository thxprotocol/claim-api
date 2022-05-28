import express from 'express';
import { FindWallet } from '@/controllers/claims/get.controller';
import { InsertWallet } from '@/controllers/claims/post.controller';

const router = express.Router();

router.get('/:wallet', FindWallet);
router.post('/wallet', InsertWallet);

export default router;
