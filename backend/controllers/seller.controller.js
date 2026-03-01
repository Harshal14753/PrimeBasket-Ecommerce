import Seller from '../models/seller.model.js';
import User from '../models/user.model.js';

// ─────────────────────────────────────────────
// POST /api/seller/create
// Auth Required | Role: seller
// ─────────────────────────────────────────────
export const createSeller = async (req, res) => {
    try {
        const { shopName, gstNumber, panNumber, bankDetails } = req.body;

        // Validate required fields
        if (!shopName || !gstNumber || !panNumber) {
            return res.status(400).json({
                success: false,
                message: 'shopName, gstNumber and panNumber are required'
            });
        }

        // Only users with role 'seller' can create a seller profile
        if (req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only seller accounts can create a seller profile'
            });
        }

        // Prevent duplicate profile
        const existingSeller = await Seller.findOne({ user: req.user._id });
        if (existingSeller) {
            return res.status(400).json({
                success: false,
                message: 'Seller profile already exists for this account'
            });
        }

        const seller = await Seller.create({
            user: req.user._id,
            shopName,
            gstNumber: gstNumber.toUpperCase(),
            panNumber: panNumber.toUpperCase(),
            bankDetails: bankDetails || {}
        });

        res.status(201).json({
            success: true,
            message: 'Seller profile created successfully. Waiting for admin approval.',
            seller
        });

    } catch (error) {
        // Duplicate GST or PAN
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field === 'gstNumber' ? 'GST Number' : 'PAN Number'} is already registered`
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// GET /api/seller/profile
// Auth Required | Role: seller
// ─────────────────────────────────────────────
export const getSeller = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id })
            .populate('user', 'name email phone role')
            .populate('pickupAddress');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found. Please create your profile first.'
            });
        }

        res.status(200).json({
            success: true,
            seller
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// PUT /api/seller/profile
// Auth Required | Role: seller
// Note: gstNumber & panNumber cannot be changed
// ─────────────────────────────────────────────
export const updateSeller = async (req, res) => {
    try {
        const { shopName, bankDetails, pickupAddress } = req.body;

        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller profile not found'
            });
        }

        if (shopName)       seller.shopName       = shopName;
        if (bankDetails)    seller.bankDetails    = bankDetails;
        if (pickupAddress)  seller.pickupAddress  = pickupAddress;

        await seller.save();

        res.status(200).json({
            success: true,
            message: 'Seller profile updated successfully',
            seller
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// GET /api/seller/all
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const getAllSeller = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.'
            });
        }

        const sellers = await Seller.find()
            .populate('user', 'name email phone createdAt')
            .populate('pickupAddress');

        res.status(200).json({
            success: true,
            count: sellers.length,
            sellers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// PUT /api/seller/approve/:sellerId
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const approveSeller = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.'
            });
        }

        const seller = await Seller.findByIdAndUpdate(
            req.params.sellerId,
            { isApproved: true },
            { new: true }
        ).populate('user', 'name email phone');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        // Mark the associated user as verified
        await User.findByIdAndUpdate(seller.user._id, { isVerified: true });

        res.status(200).json({
            success: true,
            message: `Seller "${seller.shopName}" approved and verified successfully`,
            seller
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

