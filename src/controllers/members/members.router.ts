import express from 'express';
import { validate } from '@/util/validation';
import { validations } from './_.validation';
import { ListMembersController } from './list.controller';
import { ReadMemberController } from './get.controller';
import { CreateMemberController } from './post.controller';
import { patchMember } from './patch.controller';
import { deleteMember } from './delete.controller';

const router = express.Router();

router.get('/', ListMembersController);
router.get('/:address', validate(validations.getMember), ReadMemberController);
router.post('/', validate(validations.postMember), CreateMemberController);
router.patch('/:address', validate(validations.patchMember), patchMember);
router.delete('/:address', validate(validations.deleteMember), deleteMember);

export default router;
