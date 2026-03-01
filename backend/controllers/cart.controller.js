import Cart from '../models/cart.model.js';
import ProductVariant from '../models/productVariant.model.js';
import Product from '../models/product.model.js';

// ─────────────────────────────────────────────
// GET /api/cart
// Auth Required | Role: customer
// ─────────────────────────────────────────────
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'title brand images status')
            .populate('items.variant', 'sku attributes price stock isActive')
            .populate('items.seller', 'shopName');

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                cart: { items: [], totalItems: 0, totalPrice: 0 }
            });
        }

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.status(200).json({
            success: true,
            cart: {
                _id: cart._id,
                items: cart.items,
                totalItems,
                totalPrice: parseFloat(totalPrice.toFixed(2))
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/cart/add
// Auth Required | Role: customer
// Body: { variantId, quantity }
// ─────────────────────────────────────────────
export const addItem = async (req, res) => {
    try {
        const { variantId, quantity = 1 } = req.body;

        if (!variantId) {
            return res.status(400).json({ success: false, message: 'variantId is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Validate variant exists, is active, and has enough stock
        const variant = await ProductVariant.findById(variantId).populate('product');
        if (!variant || !variant.isActive) {
            return res.status(404).json({ success: false, message: 'Product variant not available' });
        }

        const product = await Product.findById(variant.product);
        if (!product || product.status !== 'APPROVED') {
            return res.status(404).json({ success: false, message: 'Product is not available' });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${variant.stock} item(s) in stock`
            });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // If same variant already in cart, increase quantity
        const existingIndex = cart.items.findIndex(
            (item) => item.variant.toString() === variantId
        );

        if (existingIndex > -1) {
            const newQty = cart.items[existingIndex].quantity + quantity;
            if (newQty > variant.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Only ${variant.stock} item(s) in stock`
                });
            }
            cart.items[existingIndex].quantity = newQty;
        } else {
            cart.items.push({
                product: product._id,
                variant: variant._id,
                seller: product.seller,
                quantity,
                price: variant.price
            });
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cart
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/cart/item/:itemId
// Auth Required | Role: customer
// Body: { quantity }
// ─────────────────────────────────────────────
export const updateItem = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Validate stock
        const variant = await ProductVariant.findById(item.variant);
        if (!variant || !variant.isActive) {
            return res.status(400).json({ success: false, message: 'Variant no longer available' });
        }

        if (quantity > variant.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${variant.stock} item(s) in stock`
            });
        }

        item.quantity = quantity;
        item.price    = variant.price; // Refresh price on update

        await cart.save();

        res.status(200).json({ success: true, message: 'Cart item updated', cart });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/cart/item/:itemId
// Auth Required | Role: customer
// ─────────────────────────────────────────────
export const removeItem = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        item.deleteOne();
        await cart.save();

        res.status(200).json({ success: true, message: 'Item removed from cart', cart });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/cart
// Auth Required | Role: customer
// ─────────────────────────────────────────────
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({ success: true, message: 'Cart cleared successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
