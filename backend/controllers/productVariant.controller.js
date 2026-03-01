import ProductVariant from '../models/productVariant.model.js';
import Product from '../models/product.model.js';
import Seller from '../models/seller.model.js';

// ─────────────────────────────────────────────
// SKU Generator
// Format: <PRODUCT_ID_LAST6>-<ATTR_VALUES>-<TIMESTAMP_BASE36>
// e.g.  c0d123-RED-XL-m5x2k
// Retries if collision detected (unique constraint)
// ─────────────────────────────────────────────
const generateSKU = async (productId, attributes) => {
    const productPart = productId.toString().slice(-6).toUpperCase();

    const attrPart = attributes
        ? Object.values(Object.fromEntries(attributes))
              .map(v => String(v).toUpperCase().replace(/\s+/g, ''))
              .join('-')
        : 'DEFAULT';

    const randomPart = () => Date.now().toString(36).toUpperCase() +
                             Math.random().toString(36).slice(2, 5).toUpperCase();

    let sku;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 5) {
        sku = `${productPart}-${attrPart}-${randomPart()}`;
        exists = await ProductVariant.exists({ sku });
        attempts++;
    }

    return sku;
};

// ─────────────────────────────────────────────
// Helper: verify seller owns the product
// ─────────────────────────────────────────────
const getSellerAndProduct = async (userId, productId) => {
    const seller = await Seller.findOne({ user: userId });
    if (!seller) return { error: 'Seller profile not found', status: 404 };

    const product = await Product.findById(productId);
    if (!product) return { error: 'Product not found', status: 404 };

    if (product.seller.toString() !== seller._id.toString()) {
        return { error: 'Access denied. This product does not belong to you.', status: 403 };
    }

    return { seller, product };
};

// ─────────────────────────────────────────────
// GET /api/public/product/:productId/variants
// No Auth | Anyone
// ─────────────────────────────────────────────
export const getPublicVariants = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.productId, status: 'APPROVED' });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variants = await ProductVariant.find({
            product: req.params.productId,
            isActive: true
        }).sort({ price: 1 });

        res.status(200).json({ success: true, count: variants.length, variants });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/variant
// Auth | Role: seller (verified, product must be own)
// ─────────────────────────────────────────────
export const createVariant = async (req, res) => {
    try {
        const { productId, attributes, stock, price } = req.body;

        if (!productId || !stock || !price) {
            return res.status(400).json({
                success: false,
                message: 'productId, stock, and price are required'
            });
        }

        const { seller, product, error, status } = await getSellerAndProduct(req.user._id, productId);
        if (error) return res.status(status).json({ success: false, message: error });

        // Convert plain object to Map for mongoose
        const attrMap = attributes ? new Map(Object.entries(attributes)) : undefined;

        // Auto-generate unique SKU
        const sku = await generateSKU(product._id, attrMap);

        const variant = await ProductVariant.create({
            product: product._id,
            attributes: attrMap,
            sku,
            stock,
            price,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Product variant created successfully',
            variant
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/variant/product/:productId
// Auth | Role: seller (verified, own products only)
// ─────────────────────────────────────────────
export const getSellerVariants = async (req, res) => {
    try {
        const { seller, error, status } = await getSellerAndProduct(req.user._id, req.params.productId);
        if (error) return res.status(status).json({ success: false, message: error });

        const variants = await ProductVariant.find({ product: req.params.productId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: variants.length, variants });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/variant/:id
// Auth | Role: seller (verified, own variant only)
// ─────────────────────────────────────────────
export const updateVariant = async (req, res) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        // Verify seller owns underlying product
        const { error, status } = await getSellerAndProduct(req.user._id, variant.product);
        if (error) return res.status(status).json({ success: false, message: error });

        const { attributes, stock, price } = req.body;

        if (stock !== undefined)  variant.stock = stock;
        if (price !== undefined)  variant.price = price;

        // If attributes changed, regenerate SKU
        if (attributes) {
            const attrMap = new Map(Object.entries(attributes));
            variant.attributes = attrMap;
            variant.sku = await generateSKU(variant.product, attrMap);
        }

        await variant.save();

        res.status(200).json({
            success: true,
            message: 'Variant updated successfully',
            variant
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/variant/:id
// Auth | Role: seller (verified, own variant only)
// ─────────────────────────────────────────────
export const deleteVariant = async (req, res) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        const { error, status } = await getSellerAndProduct(req.user._id, variant.product);
        if (error) return res.status(status).json({ success: false, message: error });

        await variant.deleteOne();

        res.status(200).json({ success: true, message: 'Variant deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/variants
// Auth | Role: admin
// ─────────────────────────────────────────────
export const getAllVariantsAdmin = async (req, res) => {
    try {
        const { productId, isActive, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (productId) filter.product  = productId;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (Number(page) - 1) * Number(limit);

        const [variants, total] = await Promise.all([
            ProductVariant.find(filter)
                .populate('product', 'title brand status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ProductVariant.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            variants
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/variant/:id
// Auth | Role: admin — update any variant
// ─────────────────────────────────────────────
export const adminUpdateVariant = async (req, res) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        const { attributes, stock, price } = req.body;

        if (stock !== undefined) variant.stock = stock;
        if (price !== undefined) variant.price = price;

        if (attributes) {
            const attrMap = new Map(Object.entries(attributes));
            variant.attributes = attrMap;
            variant.sku = await generateSKU(variant.product, attrMap);
        }

        await variant.save();

        res.status(200).json({
            success: true,
            message: 'Variant updated successfully',
            variant
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/variant/:id
// Auth | Role: admin — delete any variant
// ─────────────────────────────────────────────
export const adminDeleteVariant = async (req, res) => {
    try {
        const variant = await ProductVariant.findByIdAndDelete(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        res.status(200).json({ success: true, message: 'Variant deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/variant/block/:id
// Auth | Role: admin — toggle isActive
// ─────────────────────────────────────────────
export const blockVariant = async (req, res) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        variant.isActive = !variant.isActive;
        await variant.save();

        res.status(200).json({
            success: true,
            message: `Variant ${variant.isActive ? 'unblocked' : 'blocked'} successfully`,
            isActive: variant.isActive,
            variant
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
