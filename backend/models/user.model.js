import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: [3, "Name must be at least 3 characters long"],
        maxLength: [50, "Name must be less than 50 characters long"]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "Password must be at least 6 characters long"]
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;