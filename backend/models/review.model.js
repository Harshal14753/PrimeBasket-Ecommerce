import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must be at most 5"]
    },
    comment: {
        type: String,
        minLength: [10, "Comment must be at least 10 characters long"],
        maxLength: [500, "Comment must be less than 500 characters long"]
    }
}, {
    timestamps: true
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;