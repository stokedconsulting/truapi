import mongoose, { Model } from "mongoose";

const InvoiceItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    price: { type: Number, required: true },
}, { _id: false });

export const PaymentSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    amount: { type: Number, required: true },
    transactionHash: { type: String },
    paidAt: { type: Date, default: Date.now },
    checkoutSession: { type: mongoose.Schema.Types.ObjectId, ref: "CheckoutSession" }
});

const InvoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    dueDate: { type: Date },
    paymentAsset: { type: String, required: true },
    paymentCollection: { type: String, enum: ["one-time", "multi-use"], required: true },
    invoiceItems: { type: [InvoiceItemSchema], required: true },
    status: {
        type: String,
        enum: ["draft", "outstanding", "overdue", "paid", "void", "partially paid"],
        default: "outstanding",
        required: true
    },
    wallet: {
        address: { type: String },
        seed: { type: String }
    },
    payments: { type: [PaymentSchema], default: [] },
}, { timestamps: true });

export const InvoiceModel = mongoose.models.Invoice as Model<InvoiceDocument> || mongoose.model("Invoice", InvoiceSchema);
export type InvoiceDocument = mongoose.InferSchemaType<typeof InvoiceSchema> & mongoose.Document;
export type PaymentDocument = mongoose.InferSchemaType<typeof PaymentSchema> & mongoose.Document;
