import { Wallet, IWallet } from '@/models/Wallet';
import { Measurement, IMeasurement } from '@/models/Measurement';

export async function jobCalculateRewards() {
    // temporary for logging purposes
    console.log("Calculating the rewards");

    let datePreviousWeek = new Date();
    datePreviousWeek.setDate(datePreviousWeek.getDate()-7); //TODO Remove magic number

    // finds only the pilot wallets those who signed up BEFORE previous week
    const wallets: IWallet[] = await Wallet.find({signedUpAt: {$lt: datePreviousWeek}});

    for (const wallet of wallets) {
        try {
            // aggregate through the measurements, match on address and group on date
            const measurements: IMeasurement[] = await Measurement.aggregate([
                { $match: {address: wallet._id, timestamp: {$gt: datePreviousWeek}}},
                {$group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }},
                        address: { $addToSet: "$address" },
                        THX_tokens: { $push: "$tokens.THX" },
                        DOIS_tokens: { $push: "$tokens.DOIS" }}}
            ]);

            for (const measurement of measurements) {

                //TODO: store the total median per day

                //TODO: get the daily / weekly balance from the fee collector

                //TODO: calculate the share of the current address

                //TODO: submit that share to the smart contract mapping (address => uint)

                // console.log(await getTotalMedianDay(measurement._id));
                // console.log(measurement.THX_tokens[Math.floor((measurement.THX_tokens.length - 1) / 2)]);
            }

        } catch {
            console.log("Could not find any measurements")
        }
    }
}

/**
 * Gets the total median (as of now the whole week, check TODO.
 * @param date the date that the aggregations needs to match.
 */
async function getTotalMedianDay(date: string) {
    let dailyTotalMedian: number = 0;

    //TODO Match with the date
    const measurements: IMeasurement[] = await Measurement.aggregate([
        {$group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }},
                THX_tokens: { $push: "$tokens.THX" },
                DOIS_tokens: { $push: "$tokens.DOIS" }}}
    ]);

    // loops through the measurements and adds it to the total amount of median / day
    for (const measurement of measurements) {
        dailyTotalMedian += measurement.THX_tokens[Math.floor((measurement.THX_tokens.length - 1) / 2)]
    }

    return dailyTotalMedian;
}
