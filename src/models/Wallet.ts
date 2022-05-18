import mongoose from 'mongoose';

export type IWallet = mongoose.Document & {
    _id: string;
    staking: boolean;
    signedUpAt: Date;
    lastActiveAt: Date;
};

const walletSchema = new mongoose.Schema({
    _id: String,
    staking: {
        type: Boolean,
        default: true,
    },
    signedUpAt: {
        type: Date,
        default: Date.now(),
    },
    lastActiveAt: {
        type: Date,
        default: Date.now(),
    },
});

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema, 'wallets');
