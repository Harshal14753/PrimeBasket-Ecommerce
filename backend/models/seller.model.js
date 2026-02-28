import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shopName: {
        type: String,
        required: true,
        minLength: [3, "Shop name must be at least 3 characters long"],
    },
    gstNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Please enter a valid GST number"]
    },
    panNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid PAN number"]
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String
    },
    pickupAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },
    isApproved: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;