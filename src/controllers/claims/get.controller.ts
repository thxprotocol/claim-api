import { Request, Response } from 'express';
import WalletService from '@/services/WalletService';

export const FindWallet = async (_req: Request, res: Response) => {
    const response = await WalletService.isWalletExisting(_req.body.wallet);
    res.status(200).send(response);
};
