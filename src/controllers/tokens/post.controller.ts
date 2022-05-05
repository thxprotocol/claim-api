import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';
import { INSERT_WALLET_KEY } from '@/config/secrets';

export const InsertToken = async (_req: Request, res: Response) => {
    let msg!: string;
    let status = 500;

    // Check if there is a keyphrase is valid, if not, return 401 error.
    if (_req.body.key != INSERT_WALLET_KEY) {
        status = 401;
        msg = 'Incrorrect or no keyphrase provided';
        res.status(status).send(msg);
    }

    const isTokenPresent = await TokenService.findTokenByAddress(_req.body.address);

    // If isTokenPresent has a value it means that the address is already un the database, so we do not insert it again.
    if (isTokenPresent) {
        msg = 'This address is already in the database';
    } else {
        status = 200;
        await TokenService.addToken(_req.body.address, _req.body.type);
        msg = 'Token added to the database';
    }

    res.status(status).send(msg);
};
