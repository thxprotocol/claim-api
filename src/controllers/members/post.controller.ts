import MemberService from '@/services/MemberService';
import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';

export async function CreateMemberController(req: Request, res: Response) {
    const isMember = await MemberService.isMember(req.assetPool, account.address);

    await MemberService.addMember(req.assetPool, req.body.address);

    res.redirect(`/${VERSION}/members/${account.address}`);
}
