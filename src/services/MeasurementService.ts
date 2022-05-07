import {Measurement} from '@/models/Measurement';

export default class MeasurementService {

    static async addMeasurement(address: string, timestamp: Date, tokens: Object) {
        return await Measurement.create({
            address: address,
            timestamp: timestamp,
            tokens: tokens
        });
    }
}