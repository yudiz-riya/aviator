const GameRounds  = require('../models/lib/GameRounds');
const emitter = require('../../globals/lib/emitter');
const mongoose = require('mongoose');

class AviatorGameManager {
    constructor() {
        this.aGames = {}; 
        emitter.on('startGame', this.startGame.bind(this));
        emitter.on('placeBet', this.placeBet.bind(this));
        emitter.on('cashOut', this.cashOut.bind(this));
        emitter.on('finishGame', this.finishGame.bind(this));
    }

    async startGame() {
        const gameId = new mongoose.Types.ObjectId().toString(); 
    
        let randomDuration;
        const isLongGame = Math.random() < 0.2; 
        console.log('isLongGame:::', isLongGame);

        if (isLongGame) {
            randomDuration = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000; 
        } else {
            randomDuration = Math.floor(Math.random() * (5000 - 2000 + 1)) + 1000; 
        }
    
        const newGame = new GameRounds({ _id: gameId, multiplier: 1.01, status: 'in-progress' });
    
        await newGame.save();
    
        this.aGames[gameId] = {
            id: gameId,
            status: 'in-progress',
            players: [],
            multiplier: 1.0,
            startTime: Date.now(),
            endTime: null,
            intervalId: null 
        };
    
        console.log(`Game ${gameId} started. It will finish in ${randomDuration / 1000} seconds.`);
    
        this.increaseMultiplier(gameId); 
    
        setTimeout(() => {
            this.finishGame(gameId);
        }, randomDuration);

        return gameId;
    }

    async placeBet({ gameId, userId, amount }) {
        const game = this.aGames[gameId]; 
        if (!game || game.status !== 'in-progress') {
            console.log('Game not found or not in progress');
            return { error: 'Game not found or not in progress' }; 
        }
    
        let player = game.players.find(p => p.userId === userId);
        if (!player) {
            player = { userId, amount: 0 };
            game.players.push(player); 
        }
    
        player.amount += amount; 
    
        console.log(`User ${userId} placed a bet of ${amount} on game ${gameId}`);
        return { success: true, game };
    }

    async cashOut({ gameId, userId }) {
        const game = this.aGames[gameId];
        if (!game || game.status !== 'in-progress') {
            console.log('Game not found or not in progress');
            return;
        }

        const player = game.players.find(p => p.userId === userId);
        if (player) {
            const payout = player.amount * game.multiplier;
            console.log(`User ${userId} cashed out with payout: ${payout}`);
        } else {
            console.log(`User ${userId} has not placed a bet in game ${gameId}`);
        }
    }

    increaseMultiplier(gameId) {
        const game = this.aGames[gameId];

        if (game && game.status === 'in-progress') {
            game.intervalId = setInterval(() => {
                game.multiplier += 0.01; 

                console.log(`Current multiplier for game ${gameId}: ${game.multiplier.toFixed(2)}x`);

                if (game.multiplier >= 2.0) { 
                    this.finishGame(gameId); 
                }
            }, 1000);
        }
    }

    async finishGame(gameId) {
        const game = this.aGames[gameId];
        if (game) {
            game.status = 'finished'; 
            game.endTime = Date.now(); 

            if (game.intervalId) {
                clearInterval(game.intervalId);
                game.intervalId = null; 
            }

            await GameRounds.updateOne({ _id: gameId }, { status: 'finished', multiplier: game.multiplier, endTime: game.endTime });

            console.log(`Game ${gameId} finished. Start Time: ${game.startTime}, End Time: ${game.endTime}`);
            console.log(`Game ${gameId} has finished with final multiplier: ${game.multiplier.toFixed(2)}x.`);
        }
    }
    
    getCurrentGameDuration(gameId) {
        const game = this.aGames[gameId];
        if (game && game.endTime && game.startTime) {
            return game.endTime - game.startTime;
        }
        return 0;
    }
}

module.exports = new AviatorGameManager();