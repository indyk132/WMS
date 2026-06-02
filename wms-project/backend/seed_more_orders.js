const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'WMS',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Stefan123456',
});

const FAKE_ORDERS = [
    {
        orderNumber: 'ORD-89241',
        status: 'W realizacji',
        notes: 'Klient: Acme Corp Logistics, Seattle, WA',
        items: [
            { sku: 'FOOD-KAWA-001', quantity: 15 }
        ]
    },
    {
        orderNumber: 'ORD-89240',
        status: 'Wysłane',
        notes: 'Klient: Global Imports LLC, Miami, FL',
        items: [
            { sku: 'AUTO-KLOCKI-001', quantity: 50 }
        ]
    },
    {
        orderNumber: 'ORD-89239',
        status: 'Oczekujące',
        notes: 'Klient: TechNova Dist., Austin, TX',
        items: [
            { sku: 'AUTO-AKU-001', quantity: 25 }
        ]
    },
    {
        orderNumber: 'ORD-89238',
        status: 'Oczekujące',
        notes: 'Klient: VeloSpeed Sp. z o.o., Poznań, PL',
        items: [
            { sku: 'ELEC-SKAN-001', quantity: 5 },
            { sku: 'ELEC-BAT-001', quantity: 20 }
        ]
    },
    {
        orderNumber: 'ORD-89237',
        status: 'W realizacji',
        notes: 'Klient: ElectroWorld S.A., Warszawa, PL',
        items: [
            { sku: 'BIUR-PAP-001', quantity: 30 },
            { sku: 'BIUR-ETY-001', quantity: 15 }
        ]
    },
    {
        orderNumber: 'ORD-89236',
        status: 'Dostarczone',
        notes: 'Klient: Apex Logistics Europe, Gdańsk, PL',
        items: [
            { sku: 'CHEM-REK-001', quantity: 10 },
            { sku: 'CHEM-PLY-001', quantity: 5 }
        ]
    },
    {
        orderNumber: 'ORD-89235',
        status: 'Oczekujące',
        notes: 'Klient: Krak-Tech Solutions, Kraków, PL',
        items: [
            { sku: 'ELEC-TAB-001', quantity: 2 },
            { sku: 'ELEC-DRUK-001', quantity: 3 }
        ]
    },
    {
        orderNumber: 'ORD-89234',
        status: 'Wysłane',
        notes: 'Klient: Baltic Shipping, Gdynia, PL',
        items: [
            { sku: 'AUTO-OLEJ-001', quantity: 8 },
            { sku: 'AUTO-HAM-001', quantity: 12 }
        ]
    },
    {
        orderNumber: 'ORD-89233',
        status: 'Oczekujące',
        notes: 'Klient: Euro-Food Sp. z o.o., Wrocław, PL',
        items: [
            { sku: 'FOOD-MLEKO-001', quantity: 200 },
            { sku: 'FOOD-RYZ-001', quantity: 50 }
        ]
    },
    {
        orderNumber: 'ORD-89232',
        status: 'Oczekujące',
        notes: 'Klient: Bio-Chemia Polska, Katowice, PL',
        items: [
            { sku: 'CHEM-PLY-001', quantity: 20 },
            { sku: 'CHEM-REK-001', quantity: 100 }
        ]
    }
];

async function seedOrders() {
    const client = await pool.connect();
    
    try {
        console.log('Rozpoczynanie czyszczenia starych zamówień w PostgreSQL...');
        await client.query('BEGIN');
        
        // Truncate tables with cascade to clear all foreign key references
        await client.query('TRUNCATE public.order_items, public.orders RESTART IDENTITY CASCADE');
        
        console.log('Wstawianie 10 nowych fake zamówień...');
        
        for (const order of FAKE_ORDERS) {
            // Insert into orders table
            const orderResult = await client.query(`
                INSERT INTO public.orders (order_number, status, notes, order_date)
                VALUES ($1, $2, $3, NOW() - INTERVAL '1 day' * $4)
                RETURNING order_id
            `, [
                order.orderNumber, 
                order.status, 
                order.notes, 
                Math.floor(Math.random() * 5) // random days ago
            ]);
            
            const orderId = orderResult.rows[0].order_id;
            
            for (const item of order.items) {
                // Find products_id by sku
                const productResult = await client.query(`
                    SELECT products_id FROM public.products WHERE sku = $1
                `, [item.sku]);
                
                if (productResult.rows.length === 0) {
                    console.warn(`Ostrzeżenie: Nie znaleziono produktu o SKU: ${item.sku}. Pomijam pozycję.`);
                    continue;
                }
                
                const productId = productResult.rows[0].products_id;
                
                // Insert into order_items
                await client.query(`
                    INSERT INTO public.order_items (order_id, products_id, order_quantity, picked_quantity)
                    VALUES ($1, $2, $3, $4)
                `, [
                    orderId, 
                    productId, 
                    item.quantity,
                    order.status === 'Wysłane' || order.status === 'Dostarczone' ? item.quantity : 0
                ]);
            }
            console.log(`Pomyślnie dodano zamówienie: ${order.orderNumber}`);
        }
        
        await client.query('COMMIT');
        console.log('Seeding zamówień zakończony sukcesem!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Błąd podczas seedowania zamówień:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedOrders();
