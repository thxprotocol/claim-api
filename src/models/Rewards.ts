import mongoose from 'mongoose';

export type IRewards = mongoose.Document & {
    address: string;
    timestamp: Date;
    rewards: Object;
};

const rewardsSchema = new mongoose.Schema({
    address: String,
    timestamp: Date,
    rewards: Object,
});

export const Rewards = mongoose.model<IRewards>('Rewards', rewardsSchema);
