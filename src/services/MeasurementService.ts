import { Measurement } from '@/models/Measurement';

export default class MeasurementService {
    static async addMeasurement(address: string, timestamp: Date, tokens: Object) {
        return await Measurement.create({
            address: address,
            timestamp: timestamp,
            tokens: tokens,
        });
    }

    static async getMeasurement(address: string, prevWeekDate: Date) {
        return Measurement.aggregate([
            {
                $match: { address: address, timestamp: { $gte: prevWeekDate } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    address: { $addToSet: '$address' },
                    tokens: { $push: '$tokens' },
                },
            },
        ]);
    }

    static async getMeasurementByDate(dateTimeFirst: Date, dateTimeSecond: Date) {
        return Measurement.aggregate([
            {
                $match: {
                    $and: [{ timestamp: { $gte: dateTimeFirst } }, { timestamp: { $lt: dateTimeSecond } }],
                },
            },
            {
                $group: {
                    _id: { address: '$address' },
                    tokens: { $push: '$tokens' },
                },
            },
        ]);
    }

    static async removeAllMeasurementsOfWallet(address: string) {
        Measurement.deleteMany({ address });
    }
}
