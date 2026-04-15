require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('../db');
const initDb = require('./initDb');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const debugRoutes = require('./routes/debugRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
    'https://prajwalgowda.online',
    'https://www.prajwalgowda.online',
    'http://prajwalgowda.online',
    'http://www.prajwalgowda.online',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://34.160.87.107'  // GCP Load Balancer IP
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`[CORS] Blocked origin: ${origin}`);
            callback(null, false); // Return false instead of throwing Error (prevents 500)
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight across all routes
app.use(express.json());

// Main Routes
console.log('[BOOT] MOUNTING /auth routes...');
app.use('/auth', authRoutes);
console.log('[BOOT] MOUNTING /products routes...');
app.use('/products', productRoutes);
console.log('[BOOT] MOUNTING /order routes...');
app.use('/order', orderRoutes);

// User-friendly aliases requested by user
app.use('/api/orders', orderRoutes);
app.use('/api/debug', debugRoutes);

// LB Aliases for new architecture
console.log('[BOOT] MOUNTING /api/products routes...');
app.use('/api/products', productRoutes);
console.log('[BOOT] MOUNTING /api/order routes...');
app.use('/api/order', orderRoutes);
console.log('[BOOT] MOUNTING /api/auth routes...');
app.use('/api/auth', authRoutes); // catches /api/auth/login, /api/auth/register, /api/auth/verify
console.log('[BOOT] ALL ROUTES MOUNTED ✅');

// Health check endpoints for AWS ALB
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
    res.status(200).send('API OK');
});

// Centralized Error Handling
app.use(errorHandler);

// Database Seeder (for Development only)
async function seedProducts() {
    try {
        const { rows } = await db.query('SELECT COUNT(*) FROM "Product"');
        const count = parseInt(rows[0].count, 10);
        if (count < 10) {
            await db.query('DELETE FROM "Product"');

            const products = [
                { id: 1, name: 'StellarBook Pro', price: 120000, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80' },
                { id: 2, name: 'StellarPhone 15', price: 80000, imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80' },
                { id: 3, name: 'NoiseCanceling Pods', price: 25000, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
                { id: 4, name: 'UltraView 4K Monitor', price: 45000, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80' },
                { id: 5, name: 'Mechanical Keyboard X', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=400&q=80' },
                { id: 6, name: 'Pro Wireless Mouse', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80' },
                { id: 7, name: 'Gamer Setup Desk', price: 30000, imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80' },
                { id: 8, name: 'Streaming WebCam', price: 15000, imageUrl: 'https://images.unsplash.com/photo-1595856429303-34e8f7cf5429?auto=format&fit=crop&w=400&q=80' },
                { id: 9, name: 'Smartwatch Series', price: 35000, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
                { id: 10, name: 'Portable SSD 2TB', price: 18000, imageUrl: 'https://images.unsplash.com/photo-1620188467120-5042ed1ce5cb?auto=format&fit=crop&w=400&q=80' }
            ];

            for (const p of products) {
                await db.query(
                    'INSERT INTO "Product" (id, name, price, "imageUrl") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                    [p.id, p.name, p.price, p.imageUrl]
                );
            }
            console.log('[SEED] Seeded 10 tech products into database');
        }
    } catch (e) {
        console.error("[ERROR] Database seed error:", e);
    }
}

// Server Startup
const startServer = async () => {
    try {
        console.log("Initializing database...");
        await initDb();

        app.listen(PORT, '0.0.0.0', async () => {
            console.log(`\n==========================================`);
            console.log(`🚀 StellarCart API running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`🛡️  CORS allowed for: ${allowedOrigins.join(', ')}`);
            console.log(`==========================================\n`);

            // Seed DB on start
            await seedProducts();
        });
    } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to connect to the database.");
        console.error(error.message);
        process.exit(1);
    }
};

startServer();
