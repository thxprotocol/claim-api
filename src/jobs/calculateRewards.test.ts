import { hasRetrievedRewards } from './calculateRewards';
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
    expect(result).toBe(false);
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
    expect(result).toBe(false);
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
