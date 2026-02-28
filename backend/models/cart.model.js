import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
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
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"]
        },
        price: {
            type: Number,
            required: true,
            min: [0, "Price must be a positive number"]
        }
    }]
}, {
    timestamps: true
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;