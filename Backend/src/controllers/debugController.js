const prisma = require('../../db');

const getDebugOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            include: { 
                user: { select: { name: true, email: true } }, 
                items: { include: { product: true } } 
            }
        });
        res.status(200).json(orders);
    } catch (e) {
        next(e);
    }
};

const getDebugProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
    } catch (e) {
        next(e);
    }
};

const getDebugUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isVerified: true,
                createdAt: true
            }
        });
        res.status(200).json(users);
    } catch (e) {
        next(e);
    }
};

module.exports = { getDebugOrders, getDebugProducts, getDebugUsers };
