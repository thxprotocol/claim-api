import { calculation, hasRetrievedRewards, median } from './calculateRewards';
import BigNumber from 'bignumber.js';

test('Should detect inactive when nothing got changed', () => {
    const database = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
    ]);

    const contract = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});

test('Should detect inactive when nothing got changed, in a different order', () => {
    const database = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
    ]);

    const contract = new Map<string, BigNumber>([
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
        ['0x001', new BigNumber(1)],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});

test('Should detect active when one reward got retrieved', () => {
    const database = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
    ]);

    const contract = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x003', new BigNumber(3)],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});

test('Should detect active when all rewards got retrieved', () => {
    const database = new Map<string, BigNumber>([
        ['0x001', new BigNumber(1)],
        ['0x002', new BigNumber(2)],
        ['0x003', new BigNumber(3)],
    ]);

    const contract = new Map<string, BigNumber>([]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});

test('Should calculate the share correctly per day', () => {
    const values = [100, 100, 1000];
    const totalMedianValues = 6100;

    const result = calculation(values, totalMedianValues, new BigNumber(1));
    expect(result.toNumber()).toBeCloseTo(0.016393443);
});

test('Should calculate the full distribution amount to the only account with values', () => {
    const values = [6000, 9000, 1000];
    const totalMedianValues = median(values);

    const result = calculation(values, totalMedianValues, new BigNumber(1));
    expect(result.toNumber()).toBe(1);
});
