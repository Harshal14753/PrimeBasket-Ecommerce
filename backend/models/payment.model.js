import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["RAZORPAY", "COD"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "UPI", "NETBANKING", "WALLET", "COD"],
      required: true,
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be a positive number"],
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
