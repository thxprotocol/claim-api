import express from 'express';
import { InsertToken } from '@/controllers/tokens/post.controller';
import { GetTokens } from '@/controllers/tokens/get.controller';

const router = express.Router();
router.get('/token', GetTokens);
router.post('/add', InsertToken);

export default router;
