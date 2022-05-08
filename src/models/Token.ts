import mongoose, { Schema } from 'mongoose';

export type IToken = mongoose.Document & {
    _id: string;
    type: string;
};

const tokenSchema = new mongoose.Schema({
    _id: String,
    type: {
        type: String,
        required: true,
    },
});

export const Token = mongoose.model<IToken>('Token', tokenSchema, 'custom-tokens');
