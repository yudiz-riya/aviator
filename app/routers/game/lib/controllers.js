const gameManager = require('../../../game/gameManager');
const log = require('../../../../globals/lib/log'); 

const controllers = {};

controllers.startGame = async (req, res) => {
    try {
        const gameId = await gameManager.startGame();
        const randomDuration = gameManager.getCurrentGameDuration(gameId);
        console.log(`Emitting gameStarted event with duration: ${randomDuration}`);
        console.log(gameId);
        io.emit('gameStarted', { time: randomDuration });
        return res.status(200).json({ code: 200, message: 'Game started successfully', gameId }); 
    } catch (error) {
        log.error('Error starting game:', error);
        return res.status(500).json({ code: 500, message: 'Error starting game' });
    }
};

controllers.placeBet = async (req, res) => {
    const { gameId, userId, amount } = req.body;
    try {
        await gameManager.placeBet({ gameId, userId, amount });
        return res.status(200).json({ code: 200, message: 'Bet placed successfully' });
    } catch (error) {
        controllers.handleError(res, 'Error starting game', error);
    }
};

controllers.cashOut = async (req, res) => {
    const { gameId, userId } = req.body;
    try {
        console.log('Request Body:', req.body); 

        const result = await gameManager.cashOut({ gameId, userId });

        if (result.error) {
            console.log(result.error);
            return res.status(403).json({ code: 403, message: result.error });
        }

        const winnings = result.winnings; 
        return res.status(200).json({
            code: 200,
            message: 'Cashed out successfully',
            data: {
                winnings,
                multiplier: result.multiplier,
                betAmount: result.betAmount
            }
        });
    } catch (error) {
        log.error('Error during cash out:', error);
        return res.status(500).json({ code: 500, message: 'Error during cash out' });
    }
};

controllers.finishGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        await gameManager.finishGame(gameId);
        return res.reply({ code: 200, message: 'Game finished successfully' });
    } catch (error) {
        controllers.handleError(res, 'Error starting game', error);
    }
};

controllers.handleError = (res, message, error) => {
    log.error(message, error);
    return res.reply({ code: 500, message });
};

module.exports = controllers;