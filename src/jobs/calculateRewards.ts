import { IWallet, Wallet } from '@/models/Wallet';
import { IMeasurement } from '@/models/Measurement';
import { getContractFromName, getFeeCollectorContract } from '@/util/network';
import MeasurementService from '@/services/MeasurementService';
import TokenService from '@/services/TokenService';
import { IToken } from '@/models/Token';
import { Contract } from 'web3-eth-contract';
import { fromWei, toWei } from 'web3-utils';
import { NetworkProvider } from '@/types/enums';
import {BigNumber} from "ethers";

/**
 * This job runs every ... hours/minutes/seconds for calculating the rewards per user and token.
 * 1 (NOT COMPLETELY DONE YET). It fetches the balances per token.
 * 2. It groups the measurements from the database per wallet by date (f.e 3 measurements on 2022-05-02 of 0x342b3fda..).
 * 3. After collecting and grouping the measurements we calculate the median per token in that measurement (f.e: THX: 356, DOIS: 240).
 * 4. After calculating the median per measurement of every wallet we store the total measurements of every wallet.
 * 5. It now runs the calculation: ((median / totalMedian) * 100) * (dailyBalanceFeeCollector / 100) for every token and stores it per wallet.
 * 6 (NOT COMPLETELY DONE YET). Submit these values to the smart contract per wallet.
 */
export async function jobCalculateRewards() {
    // temporary for logging purposes
    console.log('Calculating the rewards');
    const WEEK_DAYS = 7;

    const contract = getContractFromName(
        NetworkProvider.Main,
        'LimitedSupplyToken',
        '0xB952d9b5de7804691e7936E88915A669B15822ef',
    );
    const feecollector = getFeeCollectorContract(NetworkProvider.Main, '0xe2092A19f37D2DBBfa9c41C9b83CBAAA1294548f');

    let [balanceOfFeeCollector] = await Promise.all([
        contract.methods.balanceOf('0xe2092A19f37D2DBBfa9c41C9b83CBAAA1294548f').call(),
    ]);
    if (balanceOfFeeCollector <= 0) {
        await contract.methods.transfer('0xe2092A19f37D2DBBfa9c41C9b83CBAAA1294548f', BigNumber.from(toWei('1'))).send({
            from: '0x08302cf8648a961c607e3e7bd7b7ec3230c2a6c5',
        });
        balanceOfFeeCollector = await contract.methods.balanceOf('0xe2092A19f37D2DBBfa9c41C9b83CBAAA1294548f').call();
    }
    const dailyBalanceFeeCollector: number = Number(fromWei((balanceOfFeeCollector / WEEK_DAYS).toString()));

    const datePreviousWeek = new Date();
    datePreviousWeek.setDate(datePreviousWeek.getDate() - WEEK_DAYS);

    // finds only the pilot wallets those who signed up BEFORE previous week
    const wallets: IWallet[] = await Wallet.find({ signedUpAt: { $lt: datePreviousWeek } });
    const calculatedRewards = new Map<string, Map<string, number>>();

    const tokens: IToken[] = await TokenService.getAllTokens();
    const tokenMap = new Map<string, string>();
    tokens.forEach((token) => {
        tokenMap.set(token.type, token._id);
    });

    for (const wallet of wallets) {
        try {
            const totalRewardsPerToken = new Map<string, number>();
            const measurementsPerToken = new Map<IMeasurement, Map<string, number[]>>();

            // aggregate through the measurements, match on address and group on date
            const measurements: IMeasurement[] = await MeasurementService.getMeasurement(wallet._id, datePreviousWeek);

            // foreach measurement set median
            for (const measurement of measurements) {
                measurementsPerToken.set(measurement, getValuesFromObject(measurement.tokens));
            }

            for (const [measurement, data] of measurementsPerToken) {
                const totalMedianPerDay = await getTotalMedianDay(measurement._id);
                for (const [token, values] of data) {
                    const medianMeasurement = await median(values);
                    const share: number =
                        (medianMeasurement / totalMedianPerDay.get(token)) * 100 * (dailyBalanceFeeCollector / 100);

                    if (totalRewardsPerToken.get(token) == undefined) {
                        totalRewardsPerToken.set(token, 0);
                    }
                    totalRewardsPerToken.set(token, totalRewardsPerToken.get(token) + share);
                }
            }

            calculatedRewards.set(wallet._id, totalRewardsPerToken);
        } catch {
            console.log('Could not find any measurements');
        }
    }

    for (const [address, tokens] of calculatedRewards) {
        const filteredMap = new Map<string, number>();
        const rewards: Object[] = [];
        const existingRewards: Object[] = await feecollector.methods.getRewards(address).call();

        // sets the token id to the address (f.e DOIS = 0x03fda03f0da03f9f9df)
        for (const key of tokenMap.keys()) {
            filteredMap.set(tokenMap.get(key), tokens.get(key));
        }

        // merges the existing rewards with the current reward
        existingRewards.forEach((entry) => {
            const tAddress: string = Object.values(entry)[0];
            const tReward = Number(fromWei(Object.values(entry)[1]));
            filteredMap.set(tAddress.toLowerCase(), filteredMap.get(tAddress.toLowerCase()) + tReward)
        });

        // loop through the new filtered map and push the rewards to a new object list
        for (const [tokenAddress, reward] of filteredMap) {
            rewards.push({
                token: tokenAddress,
                amount: toWei(reward.toString())
            });
        }
        console.log(rewards)
        // call the publish rewards method to push the rewards to the smart contract
        await publishRewards(feecollector, address, rewards);
    }
}

/**
 * Method to publish the rewards to the smart contract based on the token and address of the account address.
 * @param contract The fee collector contract.
 * @param address The address of the account that the rewards will be awarded to.
 * @param rewards
 */
async function publishRewards(contract: Contract, address: string, rewards: Object[]) {
    // call the smart contract to set the rewards (from might change)
    return await contract.methods.setRewards(address, rewards).send({
        from: '0x08302cf8648a961c607e3e7bd7b7ec3230c2a6c5',
    });
}

/**
 * Async method to get the total median of a measurement filtered on day.
 * @param date The measurement that needs to match this date to.
 */
async function getTotalMedianDay(date: string) {
    const totalMedianPerDay = new Map<string, number>();

    // sets date of the measurement (f.e. 2022-05-08) and the second date + 1 (f.e. 2022-05-09)
    const dateTimeFirst = new Date(date);
    const tempTimeSecond = new Date(dateTimeFirst);
    const dateTimeSecond = new Date(tempTimeSecond.setDate(tempTimeSecond.getDate() + 1));

    // finds all the measurements between the dates above
    const measurements: IMeasurement[] = await MeasurementService.getMeasurementByDate(dateTimeFirst, dateTimeSecond);

    for (const measurement of measurements) {
        const tempValuesMap = getValuesFromObject(measurement.tokens);

        for (const [token, balances] of tempValuesMap) {
            if (totalMedianPerDay.get(token) == undefined) {
                totalMedianPerDay.set(token, 0);
            }

            // add the median of balances per token to the total
            const currentAmount = totalMedianPerDay.get(token);
            const m = await median(balances);
            totalMedianPerDay.set(token, currentAmount + m);
        }
    }

    return totalMedianPerDay;
}

/**
 * Helper method to get the values from an object of tokens.
 * @param tokens The combined token object of the measurement.
 */
function getValuesFromObject(tokens: Object) {
    const tempValuesMap = new Map<string, number[]>();

    // for every token add a as a new key to the map
    Object.values(tokens).forEach((m) => {
        Object.keys(m).forEach((token) => {
            if (tempValuesMap.get(token) == undefined) {
                tempValuesMap.set(token, []);
            }
            tempValuesMap.get(token).push(m[token]);
        });
    });

    return tempValuesMap;
}

/**
 * Helper method to calculate the median based on the values of every token in the measurement.
 * @param values the token values of the measurements.
 */
async function median(values: number[]) {
    if (values.length === 0) throw new Error('No inputs');

    values.sort(function (a: number, b: number) {
        return a - b;
    });

    const half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}
