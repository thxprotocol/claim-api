import { Rewards } from '@/models/Rewards';

export default class RewardsService {
    static async addRewards(address: string, timestamp: Date, rewards: Object) {
        return await Rewards.create({
            address: address,
            timestamp: timestamp,
            rewards: rewards,
        });
    }

    static async getLastRewards(address: string) {
        return await Rewards.findOne(
            {
                address: address,
            },
            {
                sort: {
                    timestamp: -1,
                },
            },
        );
    }

    static async removeAllRewardsOfWallet(address: string) {
        Rewards.deleteMany({
            address: address,
        });
    }
}
