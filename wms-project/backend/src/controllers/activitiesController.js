const { pool, table } = require('../db');
const { sendDbError } = require('../utils/httpErrors');

const listActivities = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                id,
                activity_type AS "type",
                worker_name AS "user",
                message,
                details,
                created_at
            FROM ${table('activities_log')}
            ORDER BY created_at DESC, id DESC
            LIMIT 50
        `);

        // Format dates into toLocaleString and toLocaleTimeString format to match frontend expectation
        const formatted = rows.map(r => {
            const date = new Date(r.created_at);
            return {
                id: `act-${r.id}`,
                timestamp: date.toLocaleString('pl-PL'),
                timeStr: date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: r.type,
                user: r.user,
                message: r.message,
                details: r.details
            };
        });

        res.json(formatted);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac rejestru aktywnosci.');
    }
};

const createActivity = async (req, res) => {
    const { type, user, message, details } = req.body;

    if (!type || !user || !message) {
        return res.status(400).json({ error: 'Polami wymaganymi sa type, user oraz message.' });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO ${table('activities_log')} (activity_type, worker_name, message, details)
            VALUES ($1, $2, $3, $4)
            RETURNING id, activity_type AS "type", worker_name AS "user", message, details, created_at
        `, [type, user, message, details || null]);

        const r = rows[0];
        const date = new Date(r.created_at);
        const formatted = {
            id: `act-${r.id}`,
            timestamp: date.toLocaleString('pl-PL'),
            timeStr: date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            type: r.type,
            user: r.user,
            message: r.message,
            details: r.details
        };

        res.status(201).json(formatted);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie utworzyc wpisu aktywnosci.');
    }
};

module.exports = {
    listActivities,
    createActivity,
};
