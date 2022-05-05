import mongoose, { Schema } from 'mongoose';

export type IToken = mongoose.Document & {
    _id: string;
    tokenType: string;
};

const tokenSchema = new mongoose.Schema({
    _id: String,
    amount: String,
});

export const Token = mongoose.model<IToken>('Wallet', tokenSchema, 'wallets');
