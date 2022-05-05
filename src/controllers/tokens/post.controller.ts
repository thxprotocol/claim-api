import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';
import { INSERT_WALLET_KEY } from '@/config/secrets';

export const InsertToken = async (_req: Request, res: Response) => {
    let msg!: string;
    let status = 500;

    if (_req.body.key != INSERT_WALLET_KEY) {
        status = 401;
        msg = 'Incrorrect or no keyphrase provided';
        res.status(status).send(msg);
    }

    const isTokenPresent = await TokenService.findTokenByAddress(_req.body.address);

    if (isTokenPresent) {
        msg = 'Token is already in database';
    } else {
        status = 200;
        await TokenService.addToken(_req.body.address, _req.body.type);
        msg = 'Token added to the database';
    }

    res.status(status).send(msg);
};
