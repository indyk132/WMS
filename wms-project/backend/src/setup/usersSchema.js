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
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACWjGGBdeCrAJ7AB6UErTkmwCPWCaEwEX1V9thIZNwuEbV15c9lbNmMHJHwd_QNwOQQ6zLNoQhB-p2UU81Vxv65-P4bAo91PRw_dDG_jPfLA-Pl2x24GTY02pyI1pRR7xFf_jPW7vAFJ85TUGWsVdRzByms2f8N3KB13bNNKNIdsBm7wdUOKnAVVYlBTV22AhJdP797M6URJ_dHyE0AvRm5_o243Vnq9cRZlfZzGTTklOsREa6OzMAPeqrrr43b32LU1yNDzx3S_4',
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
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwHUR7tQETi-tVOpQ8D2Z6S2Ry6LPePHoVJLyqc0F1WhK4g6cCbURLhGQ_gxiI6TWDkTV00txODIXMtaU6ih4PommbVIz9TZWYD4Ftg37TpF8E-VgMSL6diUUr0CiOQ2_wNLo_X8Dwyu42xQZ0FEjE-sAtbR_ZpqwjB8GqAoKi4EYvt6fB2vxO1mMZqbXthVf1h_TpNNP_g410yB38jBhiMiCK-xLxh20-f1BOO94nhAHF4xFy5W_ik2LyTUPjd9lfzD9PkmXdHgU',
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
        avatarUrl: null,
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
        avatarUrl: null,
    },
];

const ensureUsersSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table('users')} (
            user_id SERIAL PRIMARY KEY,
            employee_id VARCHAR(30) UNIQUE NOT NULL,
            first_name VARCHAR(80) NOT NULL,
            last_name VARCHAR(80) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            role VARCHAR(60) NOT NULL,
            zone_assignment VARCHAR(150) DEFAULT 'Unassigned',
            status VARCHAR(30) DEFAULT 'Active',
            avatar_url TEXT,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT users_status_check CHECK (status IN ('Active', 'Suspended'))
        )
    `);

    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table('users')}`);

    if (countResult.rows[0].count > 0) {
        return;
    }

    for (const user of DEMO_USERS) {
        const passwordHash = await hashPassword(user.password);

        await pool.query(`
            INSERT INTO ${table('users')} (
                employee_id,
                first_name,
                last_name,
                email,
                role,
                zone_assignment,
                status,
                avatar_url,
                password_hash
            )
            VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9)
        `, [
            user.employeeId,
            user.firstName,
            user.lastName,
            user.email,
            user.role,
            user.zoneAssignment,
            user.status,
            user.avatarUrl,
            passwordHash,
        ]);
    }
};

module.exports = {
    ensureUsersSchema,
};
