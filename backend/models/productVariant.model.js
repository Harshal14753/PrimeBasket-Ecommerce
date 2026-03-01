import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    attributes: {
        type: Map, // dynamic attributes
        of: String
    },

    sku: {
        type: String,
        required: true,
        unique: true
    },
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
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;