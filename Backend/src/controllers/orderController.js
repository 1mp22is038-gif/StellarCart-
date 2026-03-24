const prisma = require('../../db');

const createOrder = async (req, res, next) => {
    try {
        const { items } = req.body; 
        const userId = req.user.id; 

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or invalid' });
        }

        let total = 0;
        const validItems = [];

        // 1. Validate all products first and calculate subtotals
        for (const item of items) {
            const productId = parseInt(item.productId, 10);
            const quantity = parseInt(item.quantity, 10);

            if (!productId || !quantity || quantity <= 0) continue;

            const product = await prisma.product.findUnique({ where: { id: productId } });
            
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${productId} not found` });
            }

            const subtotal = product.price * quantity;
            total += subtotal;

            validItems.push({
                productId,
                quantity,
                price: product.price,
                subtotal
            });

            // Debug logs requested by user
            console.log("--- Validate Item ---");
            console.log("Product:", product.name);
            console.log("Price:", product.price);
            console.log("Quantity:", quantity);
            console.log("Subtotal:", subtotal);
        }

        if (validItems.length === 0) {
            return res.status(400).json({ error: 'No valid items to place an order' });
        }

        // 2. Create Order and nested OrderItems in ONE atomic operation
        const order = await prisma.order.create({
            data: {
                userId,
                total,
                items: {
                    create: validItems
                }
            },
            include: {
                items: true
            }
        });

        console.log(`[ORDER] Placed successfully! Order ID: ${order.id}, Total: ₹${total}`);
        res.status(201).json({ message: 'Order created', data: order });
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                },
                user: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Flatten response for backwards-compatible item loops
        const formattedOrders = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                formattedOrders.push({
                    orderId: order.id,
                    userName: order.user.name,
                    productName: item.product.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.subtotal, // Subtotal for this flat line
                    createdAt: order.createdAt
                });
            });
        });

        res.status(200).json(formattedOrders);
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, getOrders };
