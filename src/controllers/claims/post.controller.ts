import { Request, Response } from 'express';
import { isAddress } from 'web3-utils';
import WalletService from '@/services/WalletService';

export const InsertWallet = async (req: Request, res: Response) => {
    const { wallet } = req.body;

    let msg = '';
    let status = 400;

    // Validate if the provided address is valid
    if (!isAddress(wallet)) {
        msg = 'Provided address is invalid!';
    }

    // If msg is defined, it should skip this section as the address is invalid.
    if (!msg) {
        const result = await WalletService.findByWallet(wallet);

        if (result) {
            msg = 'Wallet already exists!';
        } else {
            // At this point wallet is valid and doesn't exist, so we can insert.
            await WalletService.addWallet(wallet);
            msg = 'Wallet has been added!';
            status = 200;
        }
    }

    res.status(status).send({
        status,
        message: msg,
    });
};
