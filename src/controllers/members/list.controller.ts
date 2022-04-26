import { Request, Response } from 'express';
import MemberService from '@/services/MemberService';

export const ListMembersController = async (req: Request, res: Response) => {
    const members = await MemberService.getByPoolAddress(req.assetPool);

    res.json(members);
};
