const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../db');
const { generateOTP, sendOTP } = require('../services/otpService');

const register = async (req, res, next) => {
    try {
        console.log("Register API hit:", req.body);
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        const user = await prisma.user.create({
            data: { name, phone, email, password: hashedPassword, otp, otpExpiresAt }
        });

        await sendOTP(email, otp);

        res.status(201).json({ 
            message: 'User created.', 
            userId: user.id, 
            mockOtp: process.env.NODE_ENV === 'development' ? otp : undefined 
        });
    } catch (e) {
        next(e);
    }
};

const verify = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

        if (user.otp !== otp || new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, otp: null, otpExpiresAt: null }
        });

        res.status(200).json({ message: 'Email successfully verified!' });
    } catch (e) {
        next(e);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'Account not found. Please click Sign Up.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        if (!user.isVerified) return res.status(403).json({ error: 'Please verify your account first', unverified: true });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (e) {
        next(e);
    }
};

module.exports = { register, verify, login };
