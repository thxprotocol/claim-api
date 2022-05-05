import express from 'express';
import { InsertToken } from '@/controllers/tokens/post.controller';
//import { g } from '@/controllers/tokens/get.controller';

const router = express.Router();

//router.get('/:token', FindWallet);
router.post('/token', InsertToken);

export default router;
