import db from './database';
import { Agenda } from 'agenda';
import { logger } from './logger';
import { jobCalculateRewards } from '@/jobs/calculateRewards';

export const eventNameCalculateRewards = 'jobCalculateRewards';

export const calculation = new Agenda({
    maxConcurrency: 1,
    lockLimit: 1,
    processEvery: '5 seconds',
});

calculation.define(eventNameCalculateRewards, jobCalculateRewards);

db.connection.once('open', async () => {
    calculation.mongo(db.connection.getClient().db(), 'calculation-jobs');
    await calculation.start();

    await calculation.every('10 seconds', eventNameCalculateRewards);

    logger.info('Started agenda processing');
});
