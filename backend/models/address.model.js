import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullname: {
        type: String,
        required: true,
        minLength: [3, "Full name must be at least 3 characters long"],
        maxLength: [50, "Full name must be less than 50 characters long"]
    },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
    },
    street: {
        type: String,
        required: true,
        minLength: [5, "Street must be at least 5 characters long"],
    },
    city: {
        type: String,
        required: true,
        minLength: [2, "City must be at least 2 characters long"],
    },
    state: {
        type: String,
        required: true,
        minLength: [2, "State must be at least 2 characters long"],
    },
    country: {
        type: String,
        required: true,
        minLength: [2, "Country must be at least 2 characters long"],
    },
    pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Address = mongoose.model('Address', addressSchema);

export default Address;