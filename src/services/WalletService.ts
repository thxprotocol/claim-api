import { Wallet } from '@/models/Wallet';

export default class WalletService {

    static async getAllWallets(){
        return Wallet.find();
    }

    static findByWallet(address: string) {
        return Wallet.findOne({_id: address });
    }

    static async addWallet(address: string){
        return await Wallet.create({
            _id: address
        });
    }
}