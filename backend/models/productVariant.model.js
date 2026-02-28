import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    color: String,
    size: String,
    stock: {
        type: Number,
        required: true,
        min: [0, "Stock must be a positive number"]
    },
    price: {
        type: Number,
        required: true,
        min: [0, "Price must be a positive number"]
    },
}, {
    timestamps: true
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;