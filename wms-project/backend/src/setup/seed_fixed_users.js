require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool, table } = require('../db');
const { hashPassword } = require('../utils/passwords');

const DEMO_USERS = [
    {
        employeeId: 'EMP-8492',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@logistics-os.com',
        role: 'Admin',
        zoneAssignment: 'Global Access',
        status: 'Active',
        password: 'admin',
    },
    {
        employeeId: 'EMP-9104',
        firstName: 'Wojtek',
        lastName: 'Nowak',
        email: 'manager@logistics-os.com',
        role: 'Warehouse Manager',
        zoneAssignment: 'Global Access',
        status: 'Active',
        password: 'manager',
    },
    {
        employeeId: 'EMP-1102',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'j.kowalski@logistics-os.com',
        role: 'Picker',
        zoneAssignment: 'Aisle 4-12',
        status: 'Active',
        password: 'picker',
    },
    {
        employeeId: 'EMP-9921',
        firstName: 'Mariusz',
        lastName: 'Pakosz',
        email: 'm.pakosz@logistics-os.com',
        role: 'Packer',
        zoneAssignment: 'Station B',
        status: 'Active',
        password: 'packer',
    },
    {
        employeeId: 'EMP-2039',
        firstName: 'Zofia',
        lastName: 'Bielska',
        email: 'sales@logistics-os.com',
        role: 'Sales Manager',
        zoneAssignment: 'Office / Sales',
        status: 'Active',
        password: 'sales',
    },
    {
        employeeId: 'EMP-3048',
        firstName: 'Maciej',
        lastName: 'Kaczmarek',
        email: 'planner@logistics-os.com',
        role: 'Logistics Planner',
        zoneAssignment: 'Global Access',
        status: 'Active',
        password: 'planner',
    },
    {
        employeeId: 'EMP-4059',
        firstName: 'Hanna',
        lastName: 'Wiśniewska',
        email: 'auditor@logistics-os.com',
        role: 'Inventory Auditor',
        zoneAssignment: 'Aisle 1-12 & B1-B7',
        status: 'Active',
        password: 'auditor',
    },
];

async function run() {
    console.log('Seeding corrected database users...');
    try {
        const tableName = table('users');
        console.log(`Using table: ${tableName}`);
        
        await pool.query(`TRUNCATE ${tableName} CASCADE`);

        for (const user of DEMO_USERS) {
            const passwordHash = await hashPassword(user.password);
            
            console.log(`Inserting ${user.firstName} ${user.lastName}...`);
            await pool.query(`
                INSERT INTO ${tableName} (
                    employee_id,
                    first_name,
                    last_name,
                    email,
                    role,
                    zone_assignment,
                    status,
                    password_hash
                )
                VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8)
            `, [
                user.employeeId,
                user.firstName,
                user.lastName,
                user.email,
                user.role,
                user.zoneAssignment,
                user.status,
                passwordHash,
            ]);
        }
        console.log('Database users seeded successfully!');
    } catch (e) {
        console.error('Error seeding users:', e);
    } finally {
        await pool.end();
    }
}

run();
