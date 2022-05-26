import { IWallet, Wallet } from '@/models/Wallet';
import { IMeasurement } from '@/models/Measurement';
import { getContractFromName, getFeeCollectorContract } from '@/util/network';
import MeasurementService from '@/services/MeasurementService';
import TokenService from '@/services/TokenService';
import { IToken } from '@/models/Token';
import { Contract } from 'web3-eth-contract';
import { fromWei, toWei } from 'web3-utils';
import { NetworkProvider } from '@/types/enums';
import { RewardEntry } from '@/models/RewardEntry';
import WalletService from '@/services/WalletService';
import RewardsService from '@/services/RewardsService';
import { BigNumber } from 'bignumber.js';

/**
 * This job runs every ... hours/minutes/seconds for calculating the rewards per user and token.
 * 1. It fetches the balances per token (IMPORTANT: for testing purposes a static share amount per token, which is 7).
 * 2. It groups the measurements from the database per wallet by date (f.e 3 measurements on 2022-05-02 of 0x342b3fda..).
 * 3. After collecting and grouping the measurements we calculate the median per token in that measurement (f.e: THX: 356, DOIS: 240).
 * 4. After calculating the median per measurement of every wallet we store the total measurements of every wallet.
 * 5. It now runs the calculation: ((median / totalMedian) * 100) * (dailyBalanceFeeCollector / 100) for every token and stores it per wallet.
 * 6. Submit these values to the smart contract per wallet.
 */
export async function jobCalculateRewards() {
    // temporary for logging purposes
    console.log('Calculating the rewards');
    const FEE_COLLECTOR_ADDRESS = '0xD4702511e43E2b778b34185A59728B57bE61aEd1';
    const MAIN_TRANSFER_ADDRESS = '0x08302cf8648a961c607e3e7bd7b7ec3230c2a6c5';
    const WEEK_DAYS = 7;
    const INACTIVE_MONTHS = 3;
    const FEE_COLLECTOR_TEST_AMOUNT = toWei('7');

    const feeCollector = getFeeCollectorContract(NetworkProvider.Main, FEE_COLLECTOR_ADDRESS);

    // get all the tokens from the custom-tokens collection
    const tokens: IToken[] = await TokenService.getAllTokens();
    const tokenMap = new Map<string, string>();

    for (const token of tokens) {
        tokenMap.set(token.type, token._id);

        // sends 8 eth to the fee collector address PER token for testing purposes.
        // 8 because it needs an offset from the 7 that is being distributed
        const limitedToken = getContractFromName(NetworkProvider.Main, 'LimitedSupplyToken', token._id);
        await limitedToken.methods.transfer(FEE_COLLECTOR_ADDRESS, toWei('8')).send({
            from: MAIN_TRANSFER_ADDRESS,
        });
    }

    // set the daily fee balance, for now 70000000... WEI / 7 (days per week) = 10000000... WEI distributed per TOKEN
    const dailyBalanceFeeCollector: BigNumber = new BigNumber(FEE_COLLECTOR_TEST_AMOUNT).div(new BigNumber(WEEK_DAYS));
    // gets the date prior to the current date or a custom date for testing purposes
    const datePreviousWeek = getDate(true, new Date('March 15 2022 1:00'), WEEK_DAYS);

    // finds only the pilot wallets those who signed up BEFORE previous week
    const wallets: IWallet[] = await Wallet.find({ signedUpAt: { $lt: datePreviousWeek } });
    const calculatedRewards = new Map<string, Map<string, BigNumber>>();

    console.group('Phase 1');
    for (const { _id, staking, lastActiveAt } of wallets) {
        console.log('Processing: ', _id);
        if (!staking) {
            console.warn('User has staking disabled');
            continue;
        }

        let databaseRewards = new Map<string, BigNumber>();
        try {
            databaseRewards = (await RewardsService.getLastRewards(_id)).rewards;
        } catch (err) {
            console.log('No database rewards found');
        }

        let contractRewards = new Map<string, BigNumber>();
        try {
            contractRewards = rewardEntryToMapping(
                decodeSolidityRewardEntries(await feeCollector.methods.getRewards(_id).call()),
            );
        } catch (err) {
            console.log('No contract rewards found');
        }

        // Check if wallet is inactive
        const hasRetrievedRewardsLastMonth = hasRetrievedRewards(databaseRewards, contractRewards);
        if (hasRetrievedRewardsLastMonth) {
            await WalletService.updateLastActiveAt(_id);
        } else {
            // Remove wallet if they've been inactive for 3 months
            const dateInactive = new Date();
            dateInactive.setMonth(dateInactive.getMonth() - INACTIVE_MONTHS);
            if (lastActiveAt < dateInactive) {
                await WalletService.removeWallet(_id);
                await MeasurementService.removeAllMeasurementsOfWallet(_id);
                console.warn('User is inactive');
                continue;
            }
        }

        try {
            // aggregate through the measurements, match on address and group on date
            const measurements: IMeasurement[] = await MeasurementService.getMeasurement(_id, datePreviousWeek);

            console.log(measurements.length, 'Measurements found');
            if (measurements.length != 7) throw new Error('Insufficient measurements');

            let totalRewardsPerToken = await calculateShare(measurements, dailyBalanceFeeCollector);

            console.log('Rewards:', totalRewardsPerToken);
            calculatedRewards.set(_id, totalRewardsPerToken);
        } catch {
            console.error('Could not find any measurements');
        }
    }
    console.groupEnd();

    console.group('Phase 2');
    for (const [address, tokens] of calculatedRewards) {
        const rewards: RewardEntry[] = [];
        const existingRewards = decodeSolidityRewardEntries(await feeCollector.methods.getRewards(address).call());

        // merges the existing rewards with the current reward
        existingRewards.forEach(({ token, amount }) => {
            tokens.set(token.toLowerCase(), (tokens.get(token.toLowerCase()) || new BigNumber(0)).plus(amount));
        });

        // loop through the new filtered map and push the rewards to a new object list
        for (const [tokenAddress, reward] of tokens) {
            rewards.push({
                token: tokenAddress,
                amount: new BigNumber(reward.toFixed(0)),
            });
        }
        console.log('Rewards:', rewards);

        if (rewards.length > 0) {
            // call the publish rewards method to push the rewards to the smart contract
            await publishRewards(feeCollector, address, rewards, MAIN_TRANSFER_ADDRESS);
            await RewardsService.addRewards(address, new Date(), rewardEntryToMapping(rewards));
        }
    }
    console.groupEnd();
}

/**
 * Method to calculate and store the share per token locally in a map to be stored in the final map later.
 * @param measurements The measurements from the database grouped by tokens per day f.e [3000, 4000, 5000]
 * @param dailyBalanceFeeCollector The daily balance that can be distributed among the users PER token (f.e 7 for THX, 7 for DOIS, etc).
 */
async function calculateShare(measurements: IMeasurement[], dailyBalanceFeeCollector: BigNumber) {
    const measurementsPerToken = new Map<IMeasurement, Map<string, number[]>>();
    const totalRewardsPerToken = new Map<string, BigNumber>();

    // foreach measurement set median
    for (const measurement of measurements) {
        measurementsPerToken.set(measurement, getValuesFromObject(measurement.tokens));
    }

    for (const [measurement, data] of measurementsPerToken) {
        const totalMedianPerDay = await getTotalMedianDay(measurement._id);
        for (const [token, values] of data) {
            const medianMeasurement = await new BigNumber(median(values));
            const totalMedian = new BigNumber(totalMedianPerDay.get(token));

            // calculate the share which is ((median / total median) * 100) * (dailyFeeBalance / 100)
            const leftSide = new BigNumber(medianMeasurement).div(totalMedian).multipliedBy(100);
            const rightSide = dailyBalanceFeeCollector.div(100);
            const share = leftSide.multipliedBy(rightSide);

            // when there is no token in the total rewards yet add the token with 0 as value
            if (totalRewardsPerToken.get(token) == undefined) {
                totalRewardsPerToken.set(token, new BigNumber(0));
            }
            // add the share to the token in the map
            totalRewardsPerToken.set(token, totalRewardsPerToken.get(token).plus(share));
        }
    }

    return totalRewardsPerToken;
}

/**
 * Method to publish the rewards to the smart contract based on the token and address of the account address.
 * @param contract The fee collector contract.
 * @param address The address of the account that the rewards will be awarded to.
 * @param rewards
 * @param mainAddress
 */
async function publishRewards(contract: Contract, address: string, rewards: RewardEntry[], mainAddress: string) {
    const temp = rewards.map((e) => ({
        token: e.token,
        amount: e.amount.toString(),
    }));

    // call the smart contract to set the rewards (from might change)
    return await contract.methods.setRewards(address, temp).send({
        from: mainAddress,
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
function median(values: number[]) {
    if (values.length === 0) throw new Error('No inputs');

    values.sort(function (a: number, b: number) {
        return a - b;
    });

    const half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

/**
 * Helper method to get the date of the previous week to start calculating measurements
 * @param testing Whether the application is used for testing or not.
 * @param startDate The provided start date for when we need to check measurements from a specific date.
 * @param amountOfDays The amount of days in a week.
 */
function getDate(testing: boolean, startDate: Date, amountOfDays: number) {
    const datePreviousWeek = new Date();
    startDate.setDate(startDate.getDate() - amountOfDays);
    datePreviousWeek.setDate(datePreviousWeek.getDate() - amountOfDays);
    return testing ? startDate : datePreviousWeek;
}

/**
 * Helper to check if any rewards have been claimed
 * @param database mapping saved in the database
 * @param contract mapping retrieved from contract
 * @returns true if the mappings are the same
 */
export function hasRetrievedRewards(database: Map<string, BigNumber>, contract: Map<string, BigNumber>): boolean {
    if (database.size != contract.size) return true;

    for (const [address, amount] of database) {
        if (!contract.has(address)) return true;

        const contractVal = contract.get(address);
        if (!contractVal || contractVal != amount) return true;
    }

    return false;
}

function decodeSolidityRewardEntries(entries: unknown[][]): RewardEntry[] {
    return entries.map((entry) => ({
        token: entry[0].toString(),
        amount: new BigNumber(entry[1].toString()),
    }));
}

function rewardEntryToMapping(entries: RewardEntry[]): Map<string, BigNumber> {
    const mapping = new Map<string, BigNumber>();
    for (const entry of entries) {
        mapping.set(entry.token, entry.amount);
    }
    return mapping;
}
