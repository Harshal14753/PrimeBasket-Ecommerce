import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    order:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["CARD", "UPI", "NETBANKING", "WALLET", "EMI", "PAY_LATER", "COD"],
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, "Amount must be a positive number"]
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending"
    }
}, {
    timestamps: true
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;