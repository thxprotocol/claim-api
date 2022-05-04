import {Request, Response} from "express";
import {isAddress} from "web3-utils";
import WalletService from "@/services/WalletService";

export const InsertWallet = async (_req: Request, res: Response) => {
    let msg!: String;
    let status: number = 400;

    // Validate if the provided address is valid
    if (!isAddress(_req.body.wallet)) {
        msg = "Provided address is invalid!"
    }

    // If msg is defined, it should skip this section as the address is invalid.
    if (!msg) {
        let result = await WalletService.findByWallet(_req.body.wallet)

        if (result) {
            msg = "Wallet already exists!"
            console.log(result)
        } else {
            // At this point wallet is valid and doesn't exist, so we can insert.
            await WalletService.addWallet(_req.body.wallet);
            msg = "Wallet has been added!"
            status = 200;
        }
    }

    res.status(status).send(msg)
};


