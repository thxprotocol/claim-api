import mongoose from 'mongoose';

export type IMeasurement = mongoose.Document & {
    timestamp: Date;
    THX_tokens: number[];
    DOIS_tokens: number[]
    address: string;
};

const measurementSchema = new mongoose.Schema(
    {
        timestamp: Date,
        THX_tokens: Number,
        DOIS_tokens: Number,
        address: String,
    },
    { timestamps: true },
);

export const Measurement = mongoose.model<IMeasurement>('Measurement', measurementSchema);
