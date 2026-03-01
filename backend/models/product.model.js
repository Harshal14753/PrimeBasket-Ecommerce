import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: [3, "Product title must be at least 3 characters long"],
        maxLength: [100, "Product title must be less than 100 characters long"]
    },
    description: {
        type: String,
        minLength: [10, "Product description must be at least 10 characters long"],
    },
    brand: {
        type: String,
        minLength: [2, "Brand name must be at least 2 characters long"],
        maxLength: [50, "Brand name must be less than 50 characters long"]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },    
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    images: [{
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(value);
            },
            message: props => `${props.value} is not a valid image URL`
        }
    }],
    price: {
        type: Number,
        required: true,
        min: [0, "Product price must be a positive number"]
    },
    discount: {
        type: Number,
        min: [0, "Discount must be a positive number"],
        max: [100, "Discount cannot be more than 100%"],
        default: 0
    }, 
    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating must be at least 0"],
        max: [5, "Rating cannot be more than 5"]
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: [0, "Total reviews must be a positive number"]
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "BLOCKED"],
        default: "PENDING"
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;