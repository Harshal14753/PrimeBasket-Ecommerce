import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import ProductVariant from '../models/productVariant.model.js';
import Payment from '../models/payment.model.js';
import Address from '../models/address.model.js';
import razorpay from '../lib/razorpay.js';

// ─────────────────────────────────────────────
// POST /api/order
// Auth Required | Role: customer
// Body: { addressId }
// Places order from the customer's current cart
// ─────────────────────────────────────────────
export const placeOrder = async (req, res) => {
    try {
        const { addressId } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: 'addressId is required' });
        }

        // Validate address belongs to customer
        const address = await Address.findOne({ _id: addressId, user: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // Load cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.variant')
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Validate stock for every item before committing anything
        for (const item of cart.items) {
            const variant = item.variant;

            if (!variant || !variant.isActive) {
                return res.status(400).json({
                    success: false,
                    message: `Variant ${variant?._id} is no longer available`
                });
            }

            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}`
                });
            }
        }

        // Build order items array
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            variant: item.variant._id,
            seller: item.seller,
            quantity: item.quantity,
            price: item.price,
            status: 'PLACED'
        }));

        // Create the order (status: AWAITING_PAYMENT until payment is confirmed)
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress: addressId,
            status: 'AWAITING_PAYMENT',
            paymentStatus: 'PENDING'
        });

        // Deduct stock atomically per variant
        const stockUpdates = cart.items.map(item =>
            ProductVariant.findByIdAndUpdate(
                item.variant._id,
                { $inc: { stock: -item.quantity } }
            )
        );
        await Promise.all(stockUpdates);

        // Clear the cart after successful order
        cart.items = [];
        await cart.save();

        const populated = await Order.findById(order._id)
            .populate('items.product', 'title brand images')
            .populate('items.variant', 'sku attributes price')
            .populate('shippingAddress');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully. Proceed to payment.',
            order: populated
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/order/my
// Auth Required | Role: customer
// Query: page, limit, status
// ─────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = { user: req.user._id };
        if (status) filter.status = status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('items.product', 'title brand images')
                .populate('items.variant', 'sku attributes price')
                .populate('shippingAddress')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            orders
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/order/:id
// Auth Required | Role: customer (own) | admin (any)
// ─────────────────────────────────────────────
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'title brand images')
            .populate('items.variant', 'sku attributes price')
            .populate('items.seller', 'name email')
            .populate('shippingAddress')
            .populate('payment');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Customer can only see their own order
        if (req.user.role === 'customer' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, order });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/order/:id/cancel
// Auth Required | Role: customer (PLACED only), admin (any cancellable status)
// Body: { reason } (optional)
// ─────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Customer can only cancel their own order
        if (req.user.role === 'customer') {
            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            // Customers can only cancel when order is PLACED
            const customerCancellableStatuses = ['AWAITING_PAYMENT', 'PLACED'];
            if (!customerCancellableStatuses.includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Order cannot be cancelled once it is ${order.status}`
                });
            }
        }

        // Admin can cancel as long as order isn't already DELIVERED / RETURNED
        if (req.user.role === 'admin') {
            const nonCancellable = ['DELIVERED', 'RETURNED', 'CANCELLED'];
            if (nonCancellable.includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel an order that is already ${order.status}`
                });
            }
        }

        // Restore stock for all non-delivered items
        const restorePromises = order.items
            .filter(item => !['DELIVERED', 'RETURNED'].includes(item.status))
            .map(item =>
                ProductVariant.findByIdAndUpdate(item.variant, { $inc: { stock: item.quantity } })
            );
        await Promise.all(restorePromises);

        // Mark all items as CANCELLED (except already delivered/returned)
        order.items = order.items.map(item => {
            if (!['DELIVERED', 'RETURNED'].includes(item.status)) {
                item.status = 'CANCELLED';
            }
            return item;
        });

        order.status = 'CANCELLED';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/order/seller/orders
// Auth Required | Role: seller
// Query: page, limit, status
// Returns all orders that contain at least one item sold by this seller
// ─────────────────────────────────────────────
export const getSellerOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = { 'items.seller': req.user._id };
        if (status) filter['items.status'] = status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'name email phone')
                .populate('items.product', 'title brand images')
                .populate('items.variant', 'sku attributes price')
                .populate('shippingAddress')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Order.countDocuments(filter)
        ]);

        // Expose only the items that belong to this seller
        const filtered = orders.map(order => {
            const sellerItems = order.items.filter(
                item => item.seller.toString() === req.user._id.toString()
            );
            return { ...order.toObject(), items: sellerItems };
        });

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            orders: filtered
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/order/seller/item/:itemId/status
// Auth Required | Role: seller (own items)
// Body: { status }
// Valid transitions: PLACED → CONFIRMED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
// ─────────────────────────────────────────────
export const updateItemStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { itemId } = req.params;

        const SELLER_ALLOWED_STATUSES = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        const order = await Order.findOne({ 'items._id': itemId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order item not found' });
        }

        const item = order.items.id(itemId);

        // Seller can only update items they own
        if (req.user.role === 'seller' && item.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied to this item' });
        }

        // Sellers cannot set arbitrary statuses
        if (req.user.role === 'seller' && !SELLER_ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Sellers can only set: ${SELLER_ALLOWED_STATUSES.join(', ')}`
            });
        }

        item.status = status;
        await order.save();

        // Sync top-level order status from items
        const itemStatuses = order.items.map(i => i.status);
        if (itemStatuses.every(s => s === 'DELIVERED')) {
            order.status = 'DELIVERED';
        } else if (itemStatuses.every(s => ['CANCELLED', 'RETURNED'].includes(s))) {
            order.status = 'CANCELLED';
        } else if (itemStatuses.some(s => s === 'OUT_FOR_DELIVERY')) {
            order.status = 'OUT_FOR_DELIVERY';
        } else if (itemStatuses.some(s => s === 'SHIPPED')) {
            order.status = 'SHIPPED';
        } else if (itemStatuses.some(s => s === 'CONFIRMED')) {
            order.status = 'CONFIRMED';
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item status updated',
            item,
            orderStatus: order.status
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/admin/orders
// Auth Required | Role: admin
// Query: page, limit, status, userId, paymentStatus
// ─────────────────────────────────────────────
export const getAllOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, userId, paymentStatus } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.user = userId;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'name email phone')
                .populate('items.product', 'title brand')
                .populate('items.variant', 'sku attributes price')
                .populate('items.seller', 'name email')
                .populate('shippingAddress')
                .populate('payment')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            orders
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/order/:id/status
// Auth Required | Role: admin
// Body: { status }
// ─────────────────────────────────────────────
export const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { status } = req.body;

        const VALID_STATUSES = [
            'AWAITING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED',
            'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
            'RETURN_REQUESTED', 'RETURNED'
        ];

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated', order });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/admin/order/:id/refund
// Auth Required | Role: admin
// Cancels the order, restores stock, and processes payment refund
// ─────────────────────────────────────────────
export const processRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('payment');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const nonRefundableStatuses = ['REFUNDED', 'CANCELLED'];
        if (order.paymentStatus === 'REFUNDED') {
            return res.status(400).json({ success: false, message: 'Payment already refunded' });
        }

        if (order.status === 'CANCELLED' && order.paymentStatus !== 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Order already cancelled without a completed payment' });
        }

        // Restore stock for all non-delivered items
        const restorePromises = order.items
            .filter(item => !['DELIVERED', 'RETURNED'].includes(item.status))
            .map(item =>
                ProductVariant.findByIdAndUpdate(item.variant, { $inc: { stock: item.quantity } })
            );
        await Promise.all(restorePromises);

        // Mark all items as RETURNED (or CANCELLED if not yet delivered)
        order.items = order.items.map(item => {
            if (item.status === 'DELIVERED') {
                item.status = 'RETURNED';
            } else if (!['RETURNED'].includes(item.status)) {
                item.status = 'CANCELLED';
            }
            return item;
        });

        const allDelivered = order.items.every(i => i.status === 'RETURNED');
        order.status = allDelivered ? 'RETURNED' : 'CANCELLED';

        // Process payment refund if payment was completed
        if (order.payment && order.paymentStatus === 'COMPLETED') {
            const payment = order.payment;

            if (payment.paymentGateway === 'RAZORPAY' && payment.razorpay_payment_id) {
                // Initiate online refund via Razorpay
                await razorpay.payments.refund(payment.razorpay_payment_id, {
                    amount: payment.amount * 100,  // in paise
                    notes: { reason: 'Admin initiated full refund', orderId: order._id.toString() }
                });
            }

            // Update Payment document
            await Payment.findByIdAndUpdate(payment._id, { status: 'REFUNDED' });

            // Sync order paymentStatus
            order.paymentStatus = 'REFUNDED';
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order refunded and cancelled successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
