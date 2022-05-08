import mongoose from 'mongoose';

export type IMeasurement = mongoose.Document & {
    timestamp: Date;
    tokens: Object;
    address: string;
};

const measurementSchema = new mongoose.Schema(
    {
        timestamp: Date,
        tokens: Object,
        address: String,
    },
    { timestamps: true },
);

export const Measurement = mongoose.model<IMeasurement>('Measurement', measurementSchema);
