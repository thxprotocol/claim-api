import { Request, Response } from 'express';
import WalletService from '@/services/WalletService';

export const FindWallet = async (_req: Request, res: Response) => {
    const response = await WalletService.isWalletExisting(_req.body.wallet);
    if (response) {
        res.status(200).send(true);
    }
    res.status(200).send(false);
};
