import { IWallet, Wallet } from '@/models/Wallet';

export default class WalletService {

    static findByWallet(address: string) {
        return Wallet.findOne({ address });
    }



}