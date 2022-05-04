import {Request, Response} from "express";
import {isAddress} from "web3-utils";

export const InsertWallet = async (_req: Request, res: Response) => {
    let msg!: String;
    let status: number = 200;

    // Validate if the provided address is valid
    if(!isAddress(_req.body.wallet)){
        msg = "Provided address is invalid"
        status = 400;
    }

    // Validate if the provided address is not yet known in our db

    // Insert the address

    console.log(_req.body.wallet);
    res.status(status).send(msg)
};


