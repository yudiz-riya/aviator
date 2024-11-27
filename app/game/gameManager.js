const GameRounds = require('../models/lib/GameRounds');
const emitter = require('../../globals/lib/emitter');
const mongoose = require('mongoose');
// const redis = require('redis');
const { createClient } = require('redis');
const client = createClient();

client.on('connect', () => console.log('Connected to Redis'));
client.on('error', (err) => console.error('Redis error:', err));
class AviatorGameManager {
    constructor() {
        this.aGames = {}; 
        emitter.on('startGame', this.startGame.bind(this));
        emitter.on('placeBet', this.placeBet.bind(this));
        emitter.on('cashOut', this.cashOut.bind(this));
        emitter.on('finishGame', this.finishGame.bind(this));
    }

    async startGame() {
        if (!client.isOpen) {
            await client.connect();
        }
        console.log('Redis client connected:', client.isOpen);

        const gameId = new mongoose.Types.ObjectId().toString(); 
        console.log(`Starting game with ID: ${gameId}`);
    
        const randomDuration = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
        console.log(`Game ${gameId} will run for a random duration of ${randomDuration / 1000} seconds.`);

        const gameData = {
            id: gameId,
            status: 'waiting',
            players: [],
            totalBets: 0,
            totalWithdrawn: 0,
            multiplier: 1.0,
            startTime: null,
            endTime: null,
            intervalId: null,
            tenPercentThreshold: 0,
            finished: false
        };

        await client.set(`game:${gameId}`, JSON.stringify(gameData), { EX: 60 });
        console.log(`Set game data in Redis for game ID: ${gameId}`);

        const gameDataFromRedis = await client.get(`game:${gameId}`);
        console.log(`Retrieved game data from Redis: ${gameDataFromRedis}`);
        this.aGames[gameId] = JSON.parse(gameDataFromRedis);
    
        this.aGames[gameId].tenPercentThreshold = this.aGames[gameId].totalBets * 0.10;
        console.log(`10% of total bets: ${this.aGames[gameId].tenPercentThreshold}`);
    
        emitter.emit('gameStartingSoon', { gameId, players: this.aGames[gameId].players });
    
        setTimeout(() => this.startGameCountdown(gameId, randomDuration), 3000);

        // setTimeout(() => {
        //     this.aGames[gameId].status = 'in-progress';
        //     this.aGames[gameId].startTime = Date.now(); 
        //     console.log(`Game ${gameId} started. It will finish in ${randomDuration / 1000} seconds.`);
            
        //     this.aGames[gameId].tenPercentThreshold = this.aGames[gameId].totalBets * 0.10;
        //     console.log(`Updated 10% of total bets: ${this.aGames[gameId].tenPercentThreshold}`);
    
        //     this.increaseMultiplier(gameId); 
    
        //     setTimeout(() => {
        //         this.finishGame(gameId);
        //     }, randomDuration);
        // }, 3000);
    
        return gameId;
    }

    async getGame(gameId) {
        const gameData = await client.get(`game:${gameId}`);
        return JSON.parse(gameData);
    }

    async placeBet({ gameId, userId, amount }) {
        const game = this.aGames[gameId]; 
        if (!game || (game.status !== 'in-progress' && game.status !== 'waiting')) {
            console.log('Game not found or not in progress');
            return { error: 'Game not found or not in progress' }; 
        }
    
        const existingPlayer = game.players.find(p => p.userId === userId);
        if (existingPlayer) {
            console.log(`User ${userId} has already placed a bet in game ${gameId}.`);
            return { error: 'You have already placed a bet in this game.' }; 
        }
    
        const player = { userId, amount };
        game.players.push(player);
        game.totalBets += amount; 
    
        game.tenPercentThreshold = game.totalBets * 0.10; 
        console.log(`User ${userId} placed a bet of ${amount} on game ${gameId}. Total bets: ${game.totalBets}`);
        console.log(`Updated 10% of total bets: ${game.tenPercentThreshold}`); 
    
        if (!game.smallestBet || amount < game.smallestBet) {
            game.smallestBet = amount; 
            console.log(`Updated smallest bet to: ${game.smallestBet}`);
        }
    
        return { success: true, game };
    }
    
    async cashOut({ gameId, userId }) {
        const game = this.aGames[gameId];
            if (!game) {
                console.log('Game not found');
                return { error: 'Game not found' };
            }
            
            if (game.status !== 'in-progress') {
                console.log(`Game status is ${game.status}. Cannot cash out.`);
                return { error: 'Game not in progress' };
            }
            
            const player = game.players.find(p => p.userId === userId);
            if (!player) {
                console.log(`User ${userId} has not placed a bet in game ${gameId}`);
                return { error: 'Player not found in this game' };
            }
            
            const totalAmount = game.totalBets - game.totalWithdrawn;
            console.log(`Total amount remaining before cashout: ${totalAmount}`);
            
            if (totalAmount < game.smallestBet) {
                console.log(`Total amount remaining is less than the smallest bet (${game.smallestBet}). Ending game.`);
                io.emit('gameCrashed', { 
                    gameId,
                    reason: 'Total amount is below the smallest bet',
                    multiplier: game.multiplier
                });
                this.finishGame(gameId);
                return { error: 'Total amount is below the smallest bet. Game has ended.' };
            }
        
            if (totalAmount <= game.tenPercentThreshold) {
                console.log(`Total amount has reached or fallen below 10% of total bets. Cashout not allowed.`);
                return { error: 'Cashout not allowed, total amount is below 10% of total bets.' };
            }
        
        const payout = player.amount * game.multiplier;
        
        if (payout > totalAmount) {
            console.log(`Payout of ${payout} exceeds total amount available for cashout: ${totalAmount}.`);
            console.log(`Ending game due to insufficient funds for cashout.`);
            this.finishGame(gameId);
            return { error: 'Insufficient funds for cashout. Game has ended.' };
        }
        
        console.log(`User ${userId} cashed out with payout: ${payout}`);
        
        game.totalWithdrawn += payout;
        console.log(`Total withdrawn updated: ${game.totalWithdrawn}`);
        
        const newTotalAmount = game.totalBets - game.totalWithdrawn;
        console.log(`Total amount remaining after cashout: ${newTotalAmount}`);
        
        console.log(`Current 10% threshold: ${game.tenPercentThreshold}`);
        
        if (newTotalAmount <= game.tenPercentThreshold) {
            console.log(`Total amount has reached or fallen below 10% of total bets. Ending game.`);
            this.finishGame(gameId);
        } else {
            console.log(`Total amount is above 10% of total bets. Game continues.`);
        }
    
        return {
            winnings: payout,
            multiplier: game.multiplier,
            betAmount: player.amount
        };
    }

    checkGameState(gameId) {
        const game = this.aGames[gameId];
        if (!game) return;

        const totalAmount = game.totalBets - game.totalWithdrawn;
        
        if (totalAmount < game.smallestBet) {
            io.emit('gameCrashed', { 
                gameId,
                reason: 'Total amount is below the smallest bet',
                multiplier: game.multiplier
            });
            this.finishGame(gameId);
        }
    }

    increaseMultiplier(gameId) {
        const game = this.aGames[gameId];

        if (game && game.status === 'in-progress') {
            game.intervalId = setInterval(() => {
                game.multiplier += 0.01;
                
                const totalAmount = game.totalBets - game.totalWithdrawn;
                if (totalAmount < game.smallestBet) {
                    io.emit('gameCrashed', { 
                        gameId,
                        reason: 'Total amount is below the smallest bet',
                        multiplier: game.multiplier
                    });
                    this.finishGame(gameId);
                    return;
                }

                console.log(`Current multiplier for game ${gameId}: ${game.multiplier.toFixed(2)}x`);

                if (game.multiplier >= 2.0) {
                    this.finishGame(gameId);
                }
            }, 1000);
        }
    }

    startGameCountdown(gameId, duration) {
        const game = this.aGames[gameId];
        if (game) {
            game.status = 'in-progress';
            game.startTime = Date.now();
            console.log(`Game ${gameId} started. It will finish in ${duration / 1000} seconds.`);
            
            // Call increaseMultiplier or any other logic here
            this.increaseMultiplier(gameId);

            // Set a timeout to finish the game after the duration
            setTimeout(() => {
                this.finishGame(gameId);
            }, duration);
        } else {
            console.log(`Game ${gameId} not found.`);
        }
    }

    async finishGame(gameId) {
        const game = this.aGames[gameId];
        if (game) {
            game.finished = true;
            game.status = 'finished'; 
            game.endTime = Date.now(); 

            if (game.intervalId) {
                clearInterval(game.intervalId);
                game.intervalId = null; 
            }

            const totalAdminProfit = game.totalBets - game.totalWithdrawn;
            console.log(`Total admin profit for game ${gameId}: ${totalAdminProfit}`);

            await GameRounds.updateOne({ _id: gameId }, { 
                status: 'finished', 
                multiplier: game.multiplier, 
                endTime: game.endTime, 
                totalAdminProfit 
            });

            console.log(`Game ${gameId} finished. Start Time: ${game.startTime}, End Time: ${game.endTime}`);
            console.log(`Game ${gameId} has finished with final multiplier: ${game.multiplier.toFixed(2)}x.`);

            io.emit('gameFinished', { gameId, multiplier: game.multiplier });
        } else {
            console.log(`Game ${gameId} has already been finished.`);
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