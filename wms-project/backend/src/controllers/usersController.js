const { pool, table } = require('../db');
const { sendDbError } = require('../utils/httpErrors');
const { hashPassword, verifyPassword } = require('../utils/passwords');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const userColumns = `
    user_id,
    employee_id,
    first_name,
    last_name,
    email,
    role,
    zone_assignment,
    status,
    avatar_url,
    created_at,
    updated_at
`;

const createEmployeeId = () => `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const normalizeRequiredString = (value) => typeof value === 'string' ? value.trim() : '';

const validateStatus = (status) => {
    if (status === undefined || status === null || status === '') return 'Active';
    return ['Active', 'Suspended'].includes(status) ? status : null;
};

const mapUserRow = (row) => ({
    id: row.employee_id,
    userId: row.user_id,
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    zoneAssignment: row.zone_assignment,
    status: row.status,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const listUsers = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ${userColumns}
            FROM ${table('users')}
            ORDER BY last_name, first_name
        `);

        res.json(rows.map(mapUserRow));
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac uzytkownikow.');
    }
};

const getUserById = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ${userColumns}
            FROM ${table('users')}
            WHERE user_id::text = $1 OR employee_id = $1
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Uzytkownik nie istnieje.' });
        }

        res.json(mapUserRow(rows[0]));
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac uzytkownika.');
    }
};

const createUser = async (req, res) => {
    const firstName = normalizeRequiredString(req.body.firstName || req.body.first_name);
    const lastName = normalizeRequiredString(req.body.lastName || req.body.last_name);
    const email = normalizeEmail(req.body.email);
    const role = normalizeRequiredString(req.body.role);
    const zoneAssignment = normalizeRequiredString(req.body.zoneAssignment || req.body.zone_assignment) || 'Unassigned';
    const status = validateStatus(req.body.status);
    const employeeId = normalizeRequiredString(req.body.employeeId || req.body.employee_id) || createEmployeeId();
    const avatarUrl = req.body.avatarUrl || req.body.avatar_url || null;
    const password = normalizeRequiredString(req.body.password) || 'changeme';

    if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({ error: 'Wymagane sa firstName, lastName, email i role.' });
    }

    if (!status) {
        return res.status(400).json({ error: 'Status musi miec wartosc Active albo Suspended.' });
    }

    try {
        const passwordHash = await hashPassword(password);
        const { rows } = await pool.query(`
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
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${userColumns}
        `, [
            employeeId,
            firstName,
            lastName,
            email,
            role,
            zoneAssignment,
            status,
            avatarUrl,
            passwordHash,
        ]);

        res.status(201).json(mapUserRow(rows[0]));
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie utworzyc uzytkownika.');
    }
};

const updateUser = async (req, res) => {
    const assignments = [];
    const values = [];

    const pushAssignment = (column, value) => {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
    };

    if (hasOwn(req.body, 'employeeId') || hasOwn(req.body, 'employee_id')) {
        const employeeId = normalizeRequiredString(req.body.employeeId || req.body.employee_id);
        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId nie moze byc pusty.' });
        }
        pushAssignment('employee_id', employeeId);
    }

    if (hasOwn(req.body, 'firstName') || hasOwn(req.body, 'first_name')) {
        const firstName = normalizeRequiredString(req.body.firstName || req.body.first_name);
        if (!firstName) {
            return res.status(400).json({ error: 'firstName nie moze byc pusty.' });
        }
        pushAssignment('first_name', firstName);
    }

    if (hasOwn(req.body, 'lastName') || hasOwn(req.body, 'last_name')) {
        const lastName = normalizeRequiredString(req.body.lastName || req.body.last_name);
        if (!lastName) {
            return res.status(400).json({ error: 'lastName nie moze byc pusty.' });
        }
        pushAssignment('last_name', lastName);
    }

    if (hasOwn(req.body, 'email')) {
        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({ error: 'email nie moze byc pusty.' });
        }
        pushAssignment('email', email);
    }

    if (hasOwn(req.body, 'role')) {
        const role = normalizeRequiredString(req.body.role);
        if (!role) {
            return res.status(400).json({ error: 'role nie moze byc puste.' });
        }
        pushAssignment('role', role);
    }

    if (hasOwn(req.body, 'zoneAssignment') || hasOwn(req.body, 'zone_assignment')) {
        pushAssignment('zone_assignment', normalizeRequiredString(req.body.zoneAssignment || req.body.zone_assignment) || 'Unassigned');
    }

    if (hasOwn(req.body, 'status')) {
        const status = validateStatus(req.body.status);
        if (!status) {
            return res.status(400).json({ error: 'Status musi miec wartosc Active albo Suspended.' });
        }
        pushAssignment('status', status);
    }

    if (hasOwn(req.body, 'avatarUrl') || hasOwn(req.body, 'avatar_url')) {
        pushAssignment('avatar_url', req.body.avatarUrl || req.body.avatar_url || null);
    }

    if (hasOwn(req.body, 'password')) {
        const password = normalizeRequiredString(req.body.password);
        if (!password) {
            return res.status(400).json({ error: 'password nie moze byc puste.' });
        }

        pushAssignment('password_hash', await hashPassword(password));
    }

    if (assignments.length === 0) {
        return res.status(400).json({ error: 'Brak pol do aktualizacji.' });
    }

    assignments.push('updated_at = NOW()');
    values.push(req.params.id);

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('users')}
            SET ${assignments.join(', ')}
            WHERE user_id::text = $${values.length} OR employee_id = $${values.length}
            RETURNING ${userColumns}
        `, values);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Uzytkownik nie istnieje.' });
        }

        res.json(mapUserRow(rows[0]));
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac uzytkownika.');
    }
};

const deleteUser = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            DELETE FROM ${table('users')}
            WHERE user_id::text = $1 OR employee_id = $1
            RETURNING ${userColumns}
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Uzytkownik nie istnieje.' });
        }

        res.json({ deleted: mapUserRow(rows[0]) });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac uzytkownika.');
    }
};

const login = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = normalizeRequiredString(req.body.password);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email i haslo sa wymagane.' });
    }

    try {
        const { rows } = await pool.query(`
            SELECT ${userColumns}, password_hash
            FROM ${table('users')}
            WHERE email = $1
        `, [email]);

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Niepoprawny email lub haslo.' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ error: 'Konto uzytkownika jest nieaktywne.' });
        }

        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Niepoprawny email lub haslo.' });
        }

        res.json({ user: mapUserRow(user) });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zalogowac uzytkownika.');
    }
};

module.exports = {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    login,
};
