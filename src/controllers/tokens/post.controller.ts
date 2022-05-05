import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';

export const InsertToken = async (_req: Request, res: Response) => {
    let msg!: string;
    let status = 500;

    console.log(_req.body.address);
    const isTokenPresent = await TokenService.findTokenByAddress(_req.body.address);
    console.log("> " + isTokenPresent);
    if (isTokenPresent) {
        msg = 'Token is already in database';
    } else {
        status = 200;
        await TokenService.addToken(_req.body.address, _req.body.type);
        msg = 'Token added to the database';

    }

    res.status(status).send(msg);
};
