import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';

export const GetTokens = async (_req: Request, res: Response) => {
    let status = 500;

    const response = await TokenService.findTokenByAddress(_req.body.wallet);

    if (!response) {
        res.status(status).send('No token found!');
    } else {
        status = 200;
        res.status(status).send(response);
    }
};
