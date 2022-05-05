import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';

export const InsertToken = async (_req: Request, res: Response) => {
    let msg!: string;
    const status = 400;

    const isTokenPresent = await TokenService.findTokenByAddress(_req.body.address);

    if (isTokenPresent) {
        await TokenService.addToken(_req.body.wallet, _req.body.type);
        msg = 'Token added to the database';
    } else {
        msg = 'Token is already in database';
    }

    res.status(status).send(msg);
};
