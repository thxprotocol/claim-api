import { Request, Response } from 'express';
import WalletService from '@/services/WalletService';

export const FindWallet = async (_req: Request, res: Response) => {
    const response = await WalletService.isWalletExisting(_req.params.wallet);
    if (response) {
        res.status(200).send(true);
    } else {
        res.status(200).send(false);
    }
};
