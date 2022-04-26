import { Request, Response } from 'express';
import { VERSION } from '@/config/secrets';

export const patchMember = async (req: Request, res: Response) => {
    // PATCH implementation here

    res.redirect(`/${VERSION}/members/${req.params.address}`);
};
