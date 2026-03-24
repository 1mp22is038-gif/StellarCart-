const prisma = require('../../db');

const getProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        next(error);
    }
};

module.exports = { getProducts };
