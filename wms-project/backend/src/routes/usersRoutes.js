const express = require('express');
const {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    login,
} = require('../controllers/usersController');

const router = express.Router();

router.post('/auth/login', login);
router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
