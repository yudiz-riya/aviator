const router = require('express').Router();
const controllers = require('./lib/controllers');
// const middleware = require('./lib/middleware');

router.post('/register', controllers.userRegister);
router.post('/login', controllers.userLogin);

module.exports = router;
