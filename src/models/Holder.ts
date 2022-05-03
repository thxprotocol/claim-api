import mongoose from 'mongoose';

export type IHolder = mongoose.Document & {
    address: string;
    balance: number;
    endStaking: string;
    stakedAmount: number;
};

const holderSchema = new mongoose.Schema(
    {
        address: String,
        balance: Number,
        endStaking: String,
        stakedAmount: Number,
    },
    { timestamps: true },
);

export const Holder = mongoose.model<IHolder>('Holder', holderSchema, 'holder');
