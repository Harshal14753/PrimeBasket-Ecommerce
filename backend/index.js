import express from 'express';
import ENV from './lib/env.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.route.js';
import sellerRoutes from './routes/seller.route.js';
import addressRoutes from './routes/address.route.js';
import adminRoutes from './routes/admin.route.js';
import guestRoutes from './routes/guest.route.js';
import productRoutes from './routes/product.route.js';
import productVariantRoutes from './routes/productVariant.route.js';
import cartRoutes from './routes/cart.route.js';
import paymentRoutes from './routes/payment.route.js';
import orderRoutes from './routes/order.route.js';

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/user', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', guestRoutes);
app.use('/api/product', productRoutes);
app.use('/api/variant', productVariantRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/order', orderRoutes);

const startServer = async () => {
    try {
        app.listen(ENV.PORT, () => {
            console.log(`Server is running on port ${ENV.PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();