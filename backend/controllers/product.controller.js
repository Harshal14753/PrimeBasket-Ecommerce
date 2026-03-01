import Product from '../models/product.model.js';
import Seller from '../models/seller.model.js';

// ─────────────────────────────────────────────
// GET /api/public/products
// No Auth Required  
// Query params: search, category, brand, page, limit
// ─────────────────────────────────────────────
export const getProducts = async (req, res) => {
    try {
        const { search, category, brand, page = 1, limit = 20 } = req.query;

        const filter = { status: 'APPROVED' };

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) filter.category = category;
        if (brand)    filter.brand    = { $regex: brand, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name level')
                .populate('seller', 'shopName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/public/product/:id
// No Auth Required
// ─────────────────────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, status: 'APPROVED' })
            .populate('category', 'name level')
            .populate('seller', 'shopName');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/product
// Auth Required | Role: seller (verified)
// ─────────────────────────────────────────────
export const createProduct = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller || !seller.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your seller account must be approved by admin before listing products.'
            });
        }

        const { title, description, brand, category, images, price, discount } = req.body;

        if (!title || !category || !images?.length || !price) {
            return res.status(400).json({
                success: false,
                message: 'title, category, images and price are required'
            });
        }

        const product = await Product.create({
            title,
            description,
            brand,
            category,
            seller: seller._id,
            images,
            price,
            discount: discount || 0,
            status: 'PENDING'
        });

        res.status(201).json({
            success: true,
            message: 'Product listed successfully. Waiting for admin approval.',
            product
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/product
// Auth Required | Role: seller (verified)
// ─────────────────────────────────────────────
export const getMyProducts = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const products = await Product.find({ seller: seller._id })
            .populate('category', 'name level')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/product/:id
// Auth Required | Role: seller (verified, own product)
// ─────────────────────────────────────────────
export const updateProduct = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own products.'
            });
        }

        const { title, description, brand, category, images, price, discount } = req.body;

        if (title)        product.title       = title;
        if (description)  product.description = description;
        if (brand)        product.brand       = brand;
        if (category)     product.category    = category;
        if (images)       product.images      = images;
        if (price)        product.price       = price;
        if (discount !== undefined) product.discount = discount;

        // Reset to PENDING after edits so admin re-approves
        product.status = 'PENDING';

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product updated successfully. Re-submitted for admin approval.',
            product
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/product/:id
// Auth Required | Role: seller (verified, own product)
// ─────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own products.'
            });
        }

        await product.deleteOne();

        res.status(200).json({ success: true, message: 'Product deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/products
// Auth Required | Role: admin
// Query params: status, category, brand, search, page, limit
// ─────────────────────────────────────────────
export const getAllProductsAdmin = async (req, res) => {
    try {
        const { status, category, brand, search, page = 1, limit = 20 } = req.query;

        const filter = {};

        if (status)   filter.status   = status;
        if (category) filter.category = category;
        if (brand)    filter.brand    = { $regex: brand, $options: 'i' };
        if (search) {
            filter.$or = [
                { title:       { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand:       { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name level')
                .populate('seller', 'shopName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/product/approve/:id
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const approveProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status: 'APPROVED' },
            { new: true }
        ).populate('seller', 'shopName');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            message: `Product "${product.title}" approved successfully`,
            product
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/product/block/:id
// Auth Required | Role: admin
// ─────────────────────────────────────────────
export const blockProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status: 'BLOCKED' },
            { new: true }
        ).populate('seller', 'shopName');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            message: `Product "${product.title}" blocked successfully`,
            product
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
