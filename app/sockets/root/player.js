// const boardManager = require('../../game/BoardManager');
const { User } = require('../../models');
const { queue, redis } = require('../../utils'); // redis
const PlayerListener = require('./listener');

class Player {
  constructor(socket) {
    this.socket = socket;
    this.iUserId = socket.user.iUserId;
    this.setEventListeners();
  }
  setEventListeners() {
    this.socket.on('ping', this.ping.bind(this));
    this.socket.on('disconnect', this.disconnect.bind(this));
    this.socket.on('joinGame', this.joinGame.bind(this)); // Add this line
    this.socket.on('leaveGame', this.leaveGame.bind(this)); // Add this line
    this.socket.on('error', error => log.red('socket error', error));
  }

  ping(body, callback) {
    callback(null, {});
  }
  
  async joinGame({ gameId }, callback) {
    if (!gameId) return this.logError(messages.required_field('game id'), callback);
    const game = await gameManager.getGame(gameId); 
    if (!game) return this.logError(messages.not_found('game'), callback);
    gameManager.joinGame(gameId, this.iUserId); 
    callback(null, { message: 'Successfully joined the game', gameId });
  }

  async leaveGame({ gameId }, callback) {
      if (!gameId) return this.logError(messages.required_field('game id'), callback);
      const game = await gameManager.getGame(gameId);
      if (!game) return this.logError(messages.not_found('game'), callback);
      gameManager.leaveGame(gameId, this.iUserId); 
      callback(null, { message: 'Successfully left the game', gameId });
  }

  async disconnect() {
    try {
      log.red('Root disconnected', this.iUserId, 'with ', this.socket.id);
      await User.updateOne({ _id: this.iUserId }, { $set: { ePlayerStatus: "offline" } });
    } catch (error) {
      log.trace("disconnect error:::", error);
    }
  }

  logError(error, callback = () => {}) {
    log.trace(error);
    callback(error);
  }
}

module.exports = Player;
