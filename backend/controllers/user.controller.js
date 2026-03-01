import User from '../models/user.model.js';

// ─────────────────────────────────────────────
// POST /api/user/register
// No Auth Required 
// ─────────────────────────────────────────────
export const userRegister = async (req, res) => {
    try {
        const { name, email, password, phone, isSeller } = req.body

        console.log("Registering user:", { name, email, password, phone, isSeller }) // Debug log
        // Validation
        if (!name || !email || !password || !phone ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            })
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            })
        }

        // Hash password
        const hashedPassword = await User.hashPassword(password);

        // Determine role based on isSeller checkbox
        const role = isSeller ? 'seller' : 'customer'

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role
        })

        // Generate token
        const token = user.generateAuthToken()

        // Return user without password
        res.status(201).json({
            success: true,
            message: `${role === 'seller' ? 'Seller' : 'User'} registered successfully`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            }
        })
    } catch (error) {
        console.log(error); 
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─────────────────────────────────────────────
// POST /api/user/login
// No Auth Required
// ─────────────────────────────────────────────
export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        }
        console.log("Login attempt:", { email, password }) // Debug log

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
        console.log("Found user:", user) // Debug log
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Compare password
        const isPasswordMatch = await user.comparePassword(password)
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Generate token
        const token = user.generateAuthToken()

        // Set cookie
        res.cookie('token', token, {
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        // Determine redirect path based on role
        const redirectTo = user.role === 'seller'
            ? '/seller/dashboard'
            : user.role === 'admin'
            ? '/admin/dashboard'
            : '/'

        // Return user without password
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            redirectTo,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─────────────────────────────────────────────
// GET /api/user/profile
// Auth Required | Role: All
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        // req.user should be set by auth middleware
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─────────────────────────────────────────────
// POST /api/user/logout
// Auth Required | Role: All
// ─────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        // Client should remove token from localStorage
        
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
