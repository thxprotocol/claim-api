import mongoose from 'mongoose';
import { BigNumber } from 'bignumber.js';

export type IRewards = mongoose.Document & {
    address: string;
    timestamp: Date;
    rewards: Map<string, BigNumber>;
};

const rewardsSchema = new mongoose.Schema({
    address: String,
    timestamp: Date,
    rewards: {
        type: Map,
        of: Number,
    },
});

export const Rewards = mongoose.model<IRewards>('Rewards', rewardsSchema);
