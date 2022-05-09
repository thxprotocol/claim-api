import {IWallet, Wallet} from '@/models/Wallet';
import {IMeasurement} from '@/models/Measurement';
import {getContractFromName, getFeeCollectorContract} from '@/util/network';
import MeasurementService from "@/services/MeasurementService";
import TokenService from "@/services/TokenService";
import {IToken} from "@/models/Token";
import {Contract} from "web3-eth-contract";
import { toWei } from 'web3-utils';

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
    console.log("Calculating the rewards");
    const WEEK_DAYS: number = 7;

    const contract = getContractFromName(0, 'LimitedSupplyToken', '0xB952d9b5de7804691e7936E88915A669B15822ef');
    const feeCollectorContract = getFeeCollectorContract(0, '0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400');

    let [balanceOfFeeCollector] = await Promise.all([contract.methods.balanceOf('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400').call()]);
    if (balanceOfFeeCollector <= 0) {
        await contract.methods.transfer('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400', 1).send({
            from: '0xB952d9b5de7804691e7936E88915A669B15822ef'
        });
        balanceOfFeeCollector = await contract.methods.balanceOf('0x5E0A87862f9175493Cc1d02199ad18Eff87Eb400').call();
    }
    const dailyBalanceFeeCollector: number = balanceOfFeeCollector / WEEK_DAYS;
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
                measurementsPerToken.set(measurement, getValuesFromObject(measurement.tokens));
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

    const tokens: IToken[] = await TokenService.getAllTokens();
    const tokenMap = new Map<string, string>();
    tokens.forEach(token => {
        tokenMap.set(token.type, token._id);
    });

    for (let key of tokenMap.keys()) {
        let clonedRewards = new Map(calculatedRewards);
        clonedRewards = deepCloneMap(calculatedRewards, clonedRewards);

        for (const [address, tokens] of clonedRewards) {
            let filteredMap: Map<string, number> = filterMap(tokens, key, tokenMap);
            clonedRewards.set(address, filteredMap);
        }

        for (const [address, tokens] of clonedRewards) {
            for (const [tokenAddress, reward] of tokens) {
                //TODO: submit that share to the smart contract mapping (address => uint)
                // CALL PUBLISH REWARDS
            }
        }

        console.log(clonedRewards);
    }
}

/**
 * Method to publish the rewards to the smart contract based on the token and address of the account address.
 * @param contract The fee collector contract.
 * @param address The address of the account that the rewards will be awarded to.
 * @param tokenaddress The address of the token from the database by type (f.e THX = 0x033b8a8b8a88baq4243)
 * @param amount The amount of tokens per token.
 */
async function publishRewards(contract: Contract, address: string, tokenaddress: string, amount: number) {
    let reward = {
        token: tokenaddress,
        amount: toWei(amount.toString())
    }

    // call the smart contract to set the rewards (from might change)
    return await contract.methods.setRewards(address, [reward]).send({
        from: '0x08302cf8648a961c607e3e7bd7b7ec3230c2a6c5'
    });
}

/**
 * Async method to get the total median of a measurement filtered on day.
 * @param date The measurement that needs to match this date to.
 */
async function getTotalMedianDay(date: string) {
    let totalMedianPerDay = new Map<string, number>();

    // sets date of the measurement (f.e. 2022-05-08) and the second date + 1 (f.e. 2022-05-09)
    const dateTimeFirst = new Date(date);
    let tempTimeSecond = new Date(dateTimeFirst);
    const dateTimeSecond = new Date(tempTimeSecond.setDate(tempTimeSecond.getDate() + 1));

    // finds all the measurements between the dates above
    const measurements: IMeasurement[] = await MeasurementService.getMeasurementByDate(dateTimeFirst, dateTimeSecond);

    for (const measurement of measurements) {
        let tempValuesMap = getValuesFromObject(measurement.tokens);

        for (const [token, balances] of tempValuesMap) {
            if (totalMedianPerDay.get(token) == undefined) {
                totalMedianPerDay.set(token, 0);
            }

            // add the median of balances per token to the total
            let currentAmount = totalMedianPerDay.get(token);
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
    let tempValuesMap = new Map<string, number[]>()

    // for every token add a as a new key to the map
    Object.values(tokens).forEach(m => {
        Object.keys(m).forEach(token => {
            if (tempValuesMap.get(token) == undefined) {
                tempValuesMap.set(token, []);
            }
            tempValuesMap.get(token).push(m[token]);
        });
    });

    return tempValuesMap;
}

/**
 * Helper method to make a deep clone of a map to use for calculating rewards.
 * @param original The original map(s) of rewards estimated.
 * @param copy The deep cloned copied map.
 */
function deepCloneMap(original: Map<string, any>, copy: Map<any, any>) {
    original.forEach((map, address) => {
        copy.set(address, new Map(map));
    });
    return copy;
}

/**
 * Helper method to filter the map and delete the token name (f.e DOIS) and replace it with the address.
 * @param map The map that needs to be filtered.
 * @param keyFilter The name of the token name that needs to be replaced/removed.
 * @param tokenMap The token map of the map with all the tokens.
 */
function filterMap(map: Map<any, any>, keyFilter: string, tokenMap: Map<string, string>) {
    for (let key of map.keys()) {
        if (key != keyFilter) {
            map.delete(key);
        }
    }
    map.set(tokenMap.get(keyFilter), map.get(keyFilter));
    map.delete(keyFilter);
    return map;
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
