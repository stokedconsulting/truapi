import mongoose, { Model } from "mongoose";
import { ChangeStreamDocument } from "mongodb"
import { PaymentSchema } from "./Invoice.model";
import { unlistenToAddress } from "@/lib/coinbase";

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
    status: {
        type: String,
        enum: ["outstanding", "paid", "partially paid"],
        default: "outstanding",
        required: true
    },
    payment: { type: PaymentSchema },
    expiresAt: { type: Date, default: Date.now() + (3600 * 1000) },
}, { timestamps: true, collectionOptions: { changeStreamPreAndPostImages: { enabled: true } } });

CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "outstanding" } });

export const CheckoutSessionModel = mongoose.models.CheckoutSession as Model<CheckoutSessionDocument> ||
    mongoose.model("CheckoutSession", CheckoutSessionSchema);
export type CheckoutSessionDocument =
    mongoose.InferSchemaType<typeof CheckoutSessionSchema> & mongoose.Document;

const changeStream = CheckoutSessionModel.watch([], { fullDocumentBeforeChange: 'required' });
changeStream.on('change', async (change: ChangeStreamDocument<CheckoutSessionDocument>) => {
    if (change.operationType === 'delete') {
        if (change.fullDocumentBeforeChange?.wallet?.address) {
            await unlistenToAddress(change.fullDocumentBeforeChange?.wallet?.address)
        }
    }
});