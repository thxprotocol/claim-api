import { Wallet } from '@/models/Wallet';

export default class WalletService {
    static async getAllWallets() {
        return Wallet.find();
    }

    static findByWallet(address: string) {
        return Wallet.findOne({
            _id: address,
        });
    }

    static async addWallet(address: string) {
        return await Wallet.create({
            _id: address,
        });
    }

    static async removeWallet(address: string) {
        await Wallet.deleteOne({
            _id: address,
        });
    }

    static async updateLastActiveAt(address: string) {
        await Wallet.updateOne(
            {
                _id: address,
            },
            {
                $set: {
                    lastActiveAt: Date.now(),
                },
            },
        );
    }

    static async getWalletsBeforeDate(date: Date) {
        return await Wallet.find({
            signedUpAt: {
                $lt: date,
            },
        });
    }
}
