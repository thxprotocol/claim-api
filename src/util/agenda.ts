import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobProcessTransactions } from '@/jobs/requireTransactions';
import {measureBalances} from "@/jobs/fetchBalance";

export const eventNameRequireTransactions = 'requireTransactions';
export const eventNameFetchBalance = 'FetchBalance';

export const agenda = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

agenda.define(eventNameRequireTransactions, jobProcessTransactions);
agenda.define(eventNameFetchBalance, measureBalances);

db.connection.once('open', async () => {
    agenda.mongo(db.connection.getClient().db(), 'jobs');
    await agenda.start();

    await agenda.every('5 seconds', eventNameRequireTransactions);

    // Runs every 8 hours starting at 00:00, skips the initialisation measurement.
    await agenda.every('0 0 0/8 ? * * *', eventNameFetchBalance,{skipImmediate: true});

    logger.info('Started agenda processing');
});
