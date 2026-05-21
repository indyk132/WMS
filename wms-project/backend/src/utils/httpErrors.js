const sendDbError = (res, error, fallbackMessage) => {
    console.error(fallbackMessage, error);

    if (error.code === '23505') {
        return res.status(409).json({ error: 'Rekord o takich danych juz istnieje.' });
    }

    if (error.code === '23503') {
        return res.status(409).json({ error: 'Operacja narusza powiazania z innymi rekordami.' });
    }

    if (error.code === '23514') {
        return res.status(400).json({ error: 'Dane nie spelniaja ograniczen bazy.' });
    }

    return res.status(500).json({ error: fallbackMessage });
};

const toInteger = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

const toOptionalNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

module.exports = {
    sendDbError,
    toInteger,
    toOptionalNumber,
};
