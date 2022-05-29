import axios from 'axios';
import { COV_PRIVATE_KEY } from '@/config/secrets';
import WalletService from '@/services/WalletService';
import MeasurementService from '@/services/MeasurementService';
import TokenService from '@/services/TokenService';

export async function measureBalances() {
    const POLYGON_CHAIN_ID = 137;
    const timeOfMeasurement = new Date();
    // Set it all to the same min/sec/ms so it can be grouped easier
    timeOfMeasurement.setHours(timeOfMeasurement.getHours(), 0, 0, 0);

    // Get all wallets
    const wallets = await WalletService.getAllWallets();

    // Get all tokens
    const validTokens = await TokenService.getAllTokens().then((res) => {
        return res.map((token) => token.type);
    });

    for (const { _id } of wallets) {
        let tokens: { [k: string]: number } = {};

        // Retrieve the balances for all wallets available
        const balance: { [k: string]: any } = await fetchBalance(POLYGON_CHAIN_ID, _id, validTokens);
        tokens = procesResponse(balance, tokens);

        // If the wallet doesn't hold any of our token, ignore.
        if (Object.keys(tokens).length > 0) {
            await MeasurementService.addMeasurement(_id, timeOfMeasurement, tokens);
        }
    }
}

async function fetchBalance(chainId: number, address: string, validTokens: string[]) {
    const bal = await axios.get(
        `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${COV_PRIVATE_KEY}`,
    );

    // Filter the result to ignore any unnecessary tokens.
    return bal.data.data.items.filter((item: { [k: string]: any }) =>
        validTokens.includes(item.contract_ticker_symbol),
    );
}

function procesResponse(balance: { [k: string]: any }, tokens: { [k: string]: number }) {
    // The response is in WEI, convert to Ether.
    for (let i = 0; i < balance.length; i++) {
        tokens[balance[i].contract_address] = +Number(balance[i].balance);
    }

    return tokens;
}
