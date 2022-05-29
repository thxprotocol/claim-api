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

    // Runs every 8 hours starting at 00:00.
    await agenda.every('0 */8 * * *', eventNameFetchBalance, 'Fetch balances of every user', {
        timezone: 'Europe/Amsterdam',
    });

    // Run the calculation once for demonstrative purposes
    await agenda.now(eventNameCalculateRewards, jobCalculateRewards);

    // Runs every monday at 01:00
    await agenda.every('0 1 * * 1', eventNameCalculateRewards, 'Calculated the rewards of every eligible user', {
        timezone: 'Europe/Amsterdam',
    });

    logger.info('Started agenda processing');
});
