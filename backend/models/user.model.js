import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import ENV from '../lib/env.js';

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
        minLength: [6, "Password must be at least 6 characters long"],
        select: false
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

// Automatically verify customers and admins on creation; sellers must be approved by admin
userSchema.pre('save', function(next) {
    if (this.isNew && this.role !== 'seller') {
        this.isVerified = true;
    }
    next();
});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
    return token;
}

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
}

const User = mongoose.model('User', userSchema);

export default User;