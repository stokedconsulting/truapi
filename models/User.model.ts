import mongoose, { Model } from "mongoose";

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true, },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true, },
    wallet: {
        id: { type: String, required: false },
        seed: { type: String, required: false, },
        address: { type: String, required: false },
        rewards: { type: [Number], required: true }
    },
}, { timestamps: true });

export const UserModel = mongoose.models.Users as Model<UserDocument> || mongoose.model("User", UserSchema);
export type UserDocument = mongoose.InferSchemaType<typeof UserSchema> & mongoose.Document;
