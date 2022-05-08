import { Wallet, IWallet } from '@/models/Wallet';
import { Measurement, IMeasurement } from '@/models/Measurement';
import {getFeeCollectorContract, getProvider} from '@/util/network';
import { getContractFromName } from '@/util/network';
import {ContractName} from "@thxnetwork/artifacts";
import MeasurementService from "@/services/MeasurementService";

/**
 *
 */
export async function jobCalculateRewards() {
    // temporary for logging purposes
    console.log("Calculating the rewards");
    const WEEK_DAYS: number = 7;

    const contract = getContractFromName(0, 'LimitedSupplyToken', '0xB952d9b5de7804691e7936E88915A669B15822ef');
    // const feeCollectorContract = getFeeCollectorContract(0, '0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400');

    let [balanceOfFeeCollector] = await Promise.all([contract.methods.balanceOf('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400').call()]);
    if (balanceOfFeeCollector <= 0) {
        await contract.methods.transfer('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400', 1).send({
            from: '0x08302cf8648a961c607e3e7bd7b7ec3230c2a6c5'
        });
        balanceOfFeeCollector = await contract.methods.balanceOf('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400').call();
    }
    const dailyBalanceFeeCollector: number = balanceOfFeeCollector / WEEK_DAYS;

    console.log(dailyBalanceFeeCollector);

    let datePreviousWeek = new Date();
    datePreviousWeek.setDate(datePreviousWeek.getDate() - WEEK_DAYS);

    // finds only the pilot wallets those who signed up BEFORE previous week
    const wallets: IWallet[] = await Wallet.find({signedUpAt: {$lt: datePreviousWeek}});
    let calculatedRewards = new Map<string, Map<string, number>>();

    for (const wallet of wallets) {
        try {
            let totalRewardsPerToken = new Map<string, number>();
            let measurementsPerToken = new Map<IMeasurement, Map<string, number[]>>();

            // aggregate through the measurements, match on address and group on date
            const measurements: IMeasurement[] = await MeasurementService.getMeasurement(wallet._id, datePreviousWeek);

            // foreach measurement set median and
            for (const measurement of measurements) {
                let tempValuesMap = new Map<string, number[]>()

                // for every token add a as a new key to the map
                Object.values(measurement.tokens).forEach(m => {
                    Object.keys(m).forEach(token => {
                        if (tempValuesMap.get(token) == undefined) {
                            tempValuesMap.set(token, []);
                        }
                        tempValuesMap.get(token).push(m[token]);
                    });
                });

                measurementsPerToken.set(measurement, tempValuesMap);
            }

            for (const [measurement, data] of measurementsPerToken) {
                const totalMedianPerDay = await getTotalMedianDay(measurement._id);
                for (const [token, values] of data) {
                    const medianMeasurement = await median(values);
                    const share: number = ((medianMeasurement / totalMedianPerDay.get(token)) * 100) * (dailyBalanceFeeCollector / 100);

                    if (totalRewardsPerToken.get(token) == undefined) {
                        totalRewardsPerToken.set(token, 0);
                    }
                    totalRewardsPerToken.set(token, totalRewardsPerToken.get(token) + share);
                }
            }

            calculatedRewards.set(wallet._id, totalRewardsPerToken);
        } catch {
            console.log("Could not find any measurements")
        }
    }

    console.log(calculatedRewards);

    //TODO: submit that share to the smart contract mapping (address => uint)
}

/**
 *
 * @param date
 */
async function getTotalMedianDay(date: string) {
    let totalMedianPerDay = new Map<string, number>();

    const dateTimeFirst = new Date(date);
    let tempTimeSecond = new Date(dateTimeFirst);
    const dateTimeSecond = new Date(tempTimeSecond.setDate(tempTimeSecond.getDate() + 1));

    const measurements: IMeasurement[] = await MeasurementService.getMeasurementByDate(dateTimeFirst, dateTimeSecond);

    for (const measurement of measurements) {
        let tempValuesMap = new Map<string, number[]>();

        // for every token add a as a new key to the map
        Object.values(measurement.tokens).forEach(m => {
            Object.keys(m).forEach(token => {
                if (tempValuesMap.get(token) == undefined) {
                    tempValuesMap.set(token, []);
                }
                tempValuesMap.get(token).push(m[token]);
            });
        });

        for (const [token, balances] of tempValuesMap) {
            if (totalMedianPerDay.get(token) == undefined) {
                totalMedianPerDay.set(token, 0);
            }

            let currentAmount = totalMedianPerDay.get(token);
            const m = await median(balances);
            totalMedianPerDay.set(token, currentAmount + m);
        }
    }

    return totalMedianPerDay;
}

/**
 * Helper method to calculate the median based on the values of every token in the measurement.
 * @param values the token values of the measurements.
 */
async function median(values: number[]) {
    if(values.length ===0) throw new Error("No inputs");

    values.sort(function(a: number, b: number){
        return a-b;
    });

    let half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}
