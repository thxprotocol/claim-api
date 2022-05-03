import mongoose from 'mongoose';

export type IWallet = mongoose.Document & {
    _id: string;
    staking: boolean;
    signedUpAt: Date;
    lastActiveAt: Date;
};

const walletSchema = new mongoose.Schema(
    {
        _id: String,
        staking: Boolean,
        signedUpAt: Date,
        lastActiveAt: Date,
    },
    { timestamps: true },
);

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
