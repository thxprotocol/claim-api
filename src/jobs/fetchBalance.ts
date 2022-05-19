import axios from 'axios';
import { COV_PRIVATE_KEY } from '@/config/secrets';
import WalletService from '@/services/WalletService';
import { fromWei } from 'web3-utils';
import MeasurementService from '@/services/MeasurementService';

export async function measureBalances() {
    const POLYGON_CHAIN_ID = 137;
    const timeOfMeasurement = new Date();
    // Set it all to the same min/sec/ms so it can be grouped easier
    timeOfMeasurement.setHours(timeOfMeasurement.getHours(), 0, 0, 0);

    // Get all wallets
    const wallets = await WalletService.getAllWallets();

    // Retrieve the balances for all wallets available
    for (let i = 0; i < wallets.length; i++) {
        let tokens: { [k: string]: number } = {};

        // Polygon Chain for Custom tokens like DOIS
        const balance: { [k: string]: any } = await fetchBalance(POLYGON_CHAIN_ID, wallets[i]._id);
        tokens = procesResponse(balance, tokens);

        // If the wallet doesn't hold any of our token, ignore.
        if (Object.keys(tokens).length >= 1) {
            await MeasurementService.addMeasurement(wallets[i]._id, timeOfMeasurement, tokens);
        }
    }
}

async function fetchBalance(chainId: number, address: string) {
    // TODO Utilise DB once !52 has been merged.
    const validTokens = ['THX', '$DOIS'];

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
        tokens[balance[i].contract_ticker_symbol] = +fromWei(balance[i].balance, 'ether');
    }

    return tokens;
}
