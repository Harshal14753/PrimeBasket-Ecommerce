import Address from '../models/address.model.js';

// ─────────────────────────────────────────────
// POST /api/address
// Auth Required | Role: customer, seller
// ─────────────────────────────────────────────
export const createAddress = async (req, res) => {
    try {
        const { fullname, phone, street, city, state, country, pincode, isDefault } = req.body;

        if (!fullname || !phone || !street || !city || !state || !country || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'fullname, phone, street, city, state, country and pincode are required'
            });
        }

        // If new address is set as default, unset all other defaults for this user
        if (isDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await Address.create({
            user: req.user._id,
            fullname,
            phone,
            street,
            city,
            state,
            country,
            pincode,
            isDefault: isDefault || false
        });

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// GET /api/address
// Auth Required | Role: customer, seller
// ─────────────────────────────────────────────
export const getMyAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// PUT /api/address/:id
// Auth Required | Role: customer, seller
// ─────────────────────────────────────────────
export const updateAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Ensure user can only update their own address
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own addresses.'
            });
        }

        const { fullname, phone, street, city, state, country, pincode, isDefault } = req.body;

        // If setting this address as default, unset all others for this user
        if (isDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        if (fullname)   address.fullname  = fullname;
        if (phone)      address.phone     = phone;
        if (street)     address.street    = street;
        if (city)       address.city      = city;
        if (state)      address.state     = state;
        if (country)    address.country   = country;
        if (pincode)    address.pincode   = pincode;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/address/:id
// Auth Required | Role: customer, seller
// ─────────────────────────────────────────────
export const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Ensure user can only delete their own address
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own addresses.'
            });
        }

        await address.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/addresses
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find()
            .populate('user', 'name email phone role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
