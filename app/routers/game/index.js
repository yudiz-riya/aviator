const express = require('express');
const router = express.Router();
const gameController = require('./lib/controllers');

router.post('/start', gameController.startGame);
router.post('/bet', gameController.placeBet);
router.post('/cashout', gameController.cashOut);
router.post('/finish', gameController.finishGame);

module.exports = router;