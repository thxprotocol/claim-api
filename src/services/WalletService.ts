import { Wallet } from '@/models/Wallet';

export default class WalletService {
    static findByWallet(address: string) {
        return Wallet.findOne({ address });
    }

    static async addWallet(address: string) {
        return await Wallet.create({
            _id: address,
        });
    }
}
