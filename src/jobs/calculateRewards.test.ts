import { hasRetrievedRewards } from './calculateRewards';

test('Should detect inactive when nothing got changed', () => {
    const database = new Map<string, number>([
        ['0x001', 1],
        ['0x002', 2],
        ['0x003', 3],
    ]);

    const contract = new Map<string, number>([
        ['0x001', 1],
        ['0x002', 2],
        ['0x003', 3],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(false);
});

test('Should detect inactive when nothing got changed, in a different order', () => {
    const database = new Map<string, number>([
        ['0x001', 1],
        ['0x002', 2],
        ['0x003', 3],
    ]);

    const contract = new Map<string, number>([
        ['0x002', 2],
        ['0x003', 3],
        ['0x001', 1],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(false);
});

test('Should detect active when one reward got retrieved', () => {
    const database = new Map<string, number>([
        ['0x001', 1],
        ['0x002', 2],
        ['0x003', 3],
    ]);

    const contract = new Map<string, number>([
        ['0x001', 1],
        ['0x003', 3],
    ]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});

test('Should detect active when all rewards got retrieved', () => {
    const database = new Map<string, number>([
        ['0x001', 1],
        ['0x002', 2],
        ['0x003', 3],
    ]);

    const contract = new Map<string, number>([]);

    const result = hasRetrievedRewards(database, contract);
    expect(result).toBe(true);
});
