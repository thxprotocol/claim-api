import mongoose from 'mongoose';

export type IRewards = mongoose.Document & {
    address: string;
    timestamp: Date;
    rewards: Map<string, number>;
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
