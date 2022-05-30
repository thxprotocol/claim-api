import { Account } from 'web3-core';
import { VOTER_PK, DEPOSITOR_PK } from './constants';
import { getProvider } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { getDiamondAbi } from '@/config/contracts';

const { web3 } = getProvider(NetworkProvider.Main);

export const voter = web3.eth.accounts.privateKeyToAccount(VOTER_PK);
export const depositor = web3.eth.accounts.privateKeyToAccount(DEPOSITOR_PK);

export function createWallet(privateKey: string) {
    return web3.eth.accounts.privateKeyToAccount(privateKey);
}

export const timeTravel = async (seconds: number) => {
    web3.extend({
        methods: [
            {
                name: 'increaseTime',
                call: 'evm_increaseTime',
                params: 1,
            },
            {
                name: 'mine',
                call: 'evm_mine',
            },
        ],
    });
    await (web3 as any).increaseTime(seconds);
};

export async function signMethod(poolAddress: string, name: string, params: any[], account: Account) {
    const diamondAbi = getDiamondAbi(NetworkProvider.Main, 'defaultPool');
    const abi: any = diamondAbi.find((fn) => fn.name === name);
    const call = web3.eth.abi.encodeFunctionCall(abi, params);

    return {
        call,
    };
}
