import { Wallet, IWallet } from '@/models/Wallet';

export async function jobCalculateRewards() {
    console.log("Calculating the rewards");

    let datePreviousWeek = new Date();
    datePreviousWeek.setDate(datePreviousWeek.getDate()-7); //TODO Remove magic numbe

    const wallets: IWallet[] = await Wallet.find({signedUpAt: {
            $lt: datePreviousWeek
        }});

    for (const wa of wallets) {
        console.log(wa.signedUpAt)
    }

}
