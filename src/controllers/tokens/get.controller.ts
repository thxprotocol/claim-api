import { Request, Response } from 'express';
import TokenService from '@/services/TokenService';

export const GetTokens = async (_req: Request, res: Response) => {
    const response = await TokenService.getAllTokens();
    res.status(200).send(response);
};
