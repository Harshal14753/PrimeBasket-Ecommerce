import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"]
        },
        price: {
            type: Number,
            required: true,
            min: [0, "Price must be a positive number"]
        },
        status: {
            type: String,
            enum: [
                "PLACED",
                "CONFIRMED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "RETURN_REQUESTED",
                "RETURNED"
            ],
            default: "PLACED"
        }
    }],
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    // Reference to the Payment document (set after payment is initiated)
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: null
    },
    // Denormalized copy of Payment.status for quick reads (no extra join needed)
    paymentStatus: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
        default: "PENDING"
    },
    // Overall order lifecycle status
    status: {
        type: String,
        enum: [
            "AWAITING_PAYMENT",  // COD or payment not yet done
            "PLACED",            // Payment confirmed
            "CONFIRMED",         // Seller confirmed
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
            "RETURN_REQUESTED",
            "RETURNED"
        ],
        default: "AWAITING_PAYMENT"
    }
}, {
    timestamps: true
});

const Order = mongoose.model("Order", orderSchema);

export default Order;