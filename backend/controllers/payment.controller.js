import crypto from 'crypto';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import Seller from '../models/seller.model.js';
import razorpay from '../lib/razorpay.js';
import ENV from '../lib/env.js';

// ─────────────────────────────────────────────────────────────
// Helper: sync payment status → order
// ─────────────────────────────────────────────────────────────
const syncOrderPayment = async (orderId, paymentId, paymentStatus) => {
    const orderStatus = paymentStatus === 'COMPLETED' ? 'PLACED' : 'AWAITING_PAYMENT';
    await Order.findByIdAndUpdate(orderId, {
        payment:       paymentId,
        paymentStatus: paymentStatus,
        ...(paymentStatus === 'COMPLETED' && { status: orderStatus })
    });
};

// ─────────────────────────────────────────────────────────────
// POST /api/payment/initiate
// Auth Required | Role: customer
// Body: { orderId, paymentMethod }
// ─────────────────────────────────────────────────────────────
export const initiatePayment = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;

        if (!orderId || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'orderId and paymentMethod are required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. This is not your order.' });
        }

        if (order.paymentStatus === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Order is already paid.' });
        }

        // Calculate total from order items
        const amount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // ── COD ──────────────────
        if (paymentMethod === 'COD') {
            const payment = await Payment.create({
                order:         order._id,
                user:          req.user._id,
                paymentGateway: 'COD',
                paymentMethod: 'COD',
                amount,
                status:        'PENDING'
            });

            await syncOrderPayment(order._id, payment._id, 'PENDING');

            return res.status(201).json({
                success: true,
                message: 'Order placed with Cash on Delivery.',
                payment
            });
        }

        // ── Razorpay ─────────────
        const razorpayOrder = await razorpay.orders.create({
            amount:   Math.round(amount * 100), // paise
            currency: 'INR',
            receipt:  `receipt_${order._id}`
        });

        const payment = await Payment.create({
            order:              order._id,
            user:               req.user._id,
            paymentGateway:     'RAZORPAY',
            paymentMethod,
            razorpay_order_id:  razorpayOrder.id,
            amount,
            status:             'PENDING'
        });

        await syncOrderPayment(order._id, payment._id, 'PENDING');

        res.status(201).json({
            success:          true,
            message:          'Razorpay order created. Complete checkout on the frontend.',
            razorpayOrderId:  razorpayOrder.id,
            razorpayKeyId:    ENV.RAZORPAY_KEY_ID,
            amount,
            currency:         'INR',
            paymentId:        payment._id
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Auth Required | Role: customer
// Body: { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
// ─────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!paymentId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'All Razorpay fields are required' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Verify HMAC signature
        const expectedSignature = crypto
            .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            payment.status = 'FAILED';
            await payment.save();
            await syncOrderPayment(payment.order, payment._id, 'FAILED');
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Signature valid → mark COMPLETED
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature  = razorpay_signature;
        payment.status              = 'COMPLETED';
        await payment.save();
        await syncOrderPayment(payment.order, payment._id, 'COMPLETED');

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully. Order is confirmed.',
            payment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payment/my
// Auth Required | Role: customer
// ─────────────────────────────────────────────────────────────
export const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('order', 'status paymentStatus createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: payments.length, payments });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payment/:id
// Auth Required | Role: customer (own) or admin
// ─────────────────────────────────────────────────────────────
export const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order', 'status paymentStatus items shippingAddress')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const isOwner = payment.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.status(200).json({ success: true, payment });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/seller/payment/order/:orderId
// Auth Required | Role: seller (verified)
// Returns payment STATUS only for orders containing their products
// ─────────────────────────────────────────────────────────────
export const getSellerOrderPaymentStatus = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Confirm order contains at least one item from this seller
        const hasItem = order.items.some(
            (item) => item.seller.toString() === seller._id.toString()
        );
        if (!hasItem) {
            return res.status(403).json({ success: false, message: 'Access denied. This order has no items from your store.' });
        }

        res.status(200).json({
            success:       true,
            orderId:       order._id,
            paymentStatus: order.paymentStatus,
            orderStatus:   order.status
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/payments
// Auth Required | Role: admin
// Query: status, page, limit
// ─────────────────────────────────────────────────────────────
export const getAllPaymentsAdmin = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .populate('user',  'name email')
                .populate('order', 'status paymentStatus createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Payment.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page:    Number(page),
            pages:   Math.ceil(total / Number(limit)),
            payments
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/payment/:id/status
// Auth Required | Role: admin
// Body: { status } — manually override payment status
// ─────────────────────────────────────────────────────────────
export const updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

        if (!status || !allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${allowed.join(', ')}`
            });
        }

        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.status = status;
        await payment.save();
        await syncOrderPayment(payment.order, payment._id, status);

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${status}`,
            payment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/admin/payment/:id/refund
// Auth Required | Role: admin
// Initiates Razorpay refund (COD → manual status update only)
// ─────────────────────────────────────────────────────────────
export const refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded.'
            });
        }

        // COD refund is manual
        if (payment.paymentGateway === 'COD') {
            payment.status = 'REFUNDED';
            await payment.save();
            await syncOrderPayment(payment.order, payment._id, 'REFUNDED');

            return res.status(200).json({
                success: true,
                message: 'COD payment marked as refunded. Process manually.',
                payment
            });
        }

        // Razorpay refund
        const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
            amount: Math.round(payment.amount * 100) // full refund in paise
        });

        payment.status = 'REFUNDED';
        await payment.save();
        await syncOrderPayment(payment.order, payment._id, 'REFUNDED');

        res.status(200).json({
            success: true,
            message: 'Refund initiated successfully via Razorpay.',
            refundId: refund.id,
            payment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
