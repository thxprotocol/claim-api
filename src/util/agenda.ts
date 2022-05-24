import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { measureBalances } from '@/jobs/fetchBalance';
import { jobCalculateRewards } from '@/jobs/calculateRewards';

export const eventNameRequireTransactions = 'requireTransactions';
export const eventNameFetchBalance = 'fetchBalances';
export const eventNameCalculateRewards = 'jobCalculateRewards';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameFetchBalance, measureBalances);
agenda.define(eventNameCalculateRewards, jobCalculateRewards);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    // Runs every 8 hours starting at 00:00, skips the initialization measurement.
    await agenda.every('0 */8 * * *', eventNameFetchBalance, {
        skipImmediate: true,
    });

    await agenda.every('10 seconds', eventNameCalculateRewards);

    logger.info('Started agenda processing');
});
