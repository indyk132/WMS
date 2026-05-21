const express = require('express');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const locationsRoutes = require('./routes/locationsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const productsRoutes = require('./routes/productsRoutes');
const stockRoutes = require('./routes/stockRoutes');
const usersRoutes = require('./routes/usersRoutes');
const { ensureCatalogSchema } = require('./setup/catalogSchema');
const { ensureUsersSchema } = require('./setup/usersSchema');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api', inventoryRoutes);
app.use('/api', locationsRoutes);
app.use('/api', ordersRoutes);
app.use('/api', productsRoutes);
app.use('/api', stockRoutes);
app.use('/api', usersRoutes);

const startServer = async () => {
    try {
        await ensureCatalogSchema();
        await ensureUsersSchema();

        app.listen(PORT, () => {
            console.log(`Serwer WMS dziala na porcie ${PORT}`);
        });
    } catch (error) {
        console.error('Nie udalo sie uruchomic backendu WMS:', error);
        process.exit(1);
    }
};

startServer();
