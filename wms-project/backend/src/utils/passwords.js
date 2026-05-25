const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedHash) => {
    if (!storedHash || typeof storedHash !== 'string') {
        return false;
    }

    const [algorithm, salt, hash] = storedHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !hash) {
        return false;
    }

    const derivedKey = await scrypt(password, salt, KEY_LENGTH);
    const storedBuffer = Buffer.from(hash, 'hex');

    if (storedBuffer.length !== derivedKey.length) {
        return false;
    }

    return crypto.timingSafeEqual(storedBuffer, derivedKey);
};

module.exports = {
    hashPassword,
    verifyPassword,
};
