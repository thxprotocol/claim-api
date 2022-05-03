import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { calculateRewards } from '@/jobs/calculateRewards';

export const eventNameCalculateRewards = 'calculateRewards';

export const calculation = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '1 second',
});

calculation.define(eventNameCalculateRewards, calculateRewards);

db.connection.once('open', async () => {
    calculation.mongo(db.connection.getClient().db(), 'pilot-wallet');
    await calculation.start();

    await calculation.every('5 seconds', eventNameCalculateRewards);

    logger.info('Started agenda processing');
});
