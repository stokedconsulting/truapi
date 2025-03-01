import mongoose, { Model } from "mongoose";

const CheckoutSessionSchema = new mongoose.Schema({
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    wallet: {
        address: { type: String },
        seed: { type: String }
    },
    expiresAt: { type: Date, default: Date.now() + (3600 * 1000) },
}, { timestamps: true });

CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CheckoutSessionModel = mongoose.models.CheckoutSession as Model<CheckoutSessionDocument> ||
    mongoose.model("CheckoutSession", CheckoutSessionSchema);
export type CheckoutSessionDocument =
    mongoose.InferSchemaType<typeof CheckoutSessionSchema> & mongoose.Document;
