import express from 'express';
// import { ReadHealthController } from './get.controller';
import { ReadHoldersController } from './get.controller'
import { CreateHolderController } from './post.controller'
const router = express.Router();

router.get('/', ReadHoldersController);
router.post('/add', CreateHolderController);

export default router;
