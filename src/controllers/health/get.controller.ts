import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { diamondFacetAddresses, getContractConfig } from '@/config/contracts';
import { logger } from '@/util/logger';
import { currentVersion, diamondVariants } from '@thxnetwork/artifacts';

function handleError(error: Error) {
    logger.error(error);
    return { error: 'invalid response' };
}

async function getFeeData(npid: NetworkProvider) {
    try {
        return await getEstimatesFromOracle(npid);
    } catch (error) {
        return handleError(error);
    }
}

function facetAdresses(npid: NetworkProvider) {
    const result: Record<string, unknown> = {};

    for (const variant of diamondVariants) {
        result[variant] = diamondFacetAddresses(npid, variant);
    }

    return result;
}

async function getNetworkDetails(npid: NetworkProvider) {
    try {
        const provider = getProvider(npid);
        const { admin, web3 } = provider;
        const balance = await web3.eth.getBalance(admin.address);

        return {
            admin: {
                address: admin.address,
                balance: fromWei(balance, 'ether'),
            },
            feeData: await getFeeData(npid),
            facets: facetAdresses(npid),
        };
    } catch (error) {
        return handleError(error);
    }
}

export const ReadHealthController = async (_req: Request, res: Response) => {
    const jsonData = {
        name,
        version,
        license,
        artifacts: currentVersion,
        testnet: {
            ...(await getNetworkDetails(NetworkProvider.Test)),
            factory: getContractConfig(NetworkProvider.Test, 'AssetPoolFactory').address,
            registry: getContractConfig(NetworkProvider.Test, 'AssetPoolRegistry').address,
        },
        mainnet: {
            ...(await getNetworkDetails(NetworkProvider.Main)),
            factory: getContractConfig(NetworkProvider.Main, 'AssetPoolFactory').address,
            registry: getContractConfig(NetworkProvider.Main, 'AssetPoolRegistry').address,
        },
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
