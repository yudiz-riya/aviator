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
    this.socket.on('reqJoinBoard', this.joinBoard.bind(this));
    this.socket.on('error', error => log.red('socket error', error));
  }
  ping(body, callback) {
    callback(null, {});
  }
  //   async joinBoard({ iBoardId, isReconnect }, callback) {
  //     if (!iBoardId) return this.logError(messages.required_field('board id'), callback);
  //     log.green('##joinBoard with args :: ', iBoardId, isReconnect);
  //     const board = await boardManager.getBoard(iBoardId);
  //     log.green('board find in join table socket :: ');

  //     if (!board) {
  //       return callback(null, { oData: { eState: 'finished' } });
  //     }
  //     // TODO reconnection flag from BE side
  //     const participantReconnect = board.getParticipant(this.iUserId);
  //     if (participantReconnect) {
  //       log.white('participantReconnect :: reconnected ');
  //       isReconnect = true;
  //     } else {
  //       isReconnect = false;
  //       log.white('participantReconnect :: new participant.');
  //     }

  //     //* check Schedular Present or Not
  //     const schedularPresent = await redis.client.keys(`${iBoardId}:scheduler:assignTurnTimeout:*`);
  //     if (isReconnect && !schedularPresent.length) {
  //       log.green('in not Schedular Present condition in REconnect Only.....');
  //       await board.setScheduler('assignTurnTimeout', board.iUserTurn ? board.iUserTurn : this.iUserId, 10000);
  //     }

  //     let oPlayerObj = {};

  //     // for (const participant of board.aPlayer) {
  //     //   if (participant.user_id === this.socket.user.iUserId)
  //     //     oPlayerObj = { _id: participant.user_id, sUserName: participant.sUserName, image: participant.image, nColor: participant.nColor, nDiamond: participant.nDiamond };
  //     // }

  //     const params = {
  //       iBoardId: iBoardId,
  //       oUserData: oPlayerObj,
  //     };
  //     log.red('isReconnect before joining process :: ', isReconnect);
  //     if (!isReconnect && board.eState === 'waiting') {
  //       log.cyan('New player join here ############ ...');
  //       await board.addParticipant(params);
  //     }

  //     const participant = board.getParticipant(this.iUserId);
  //     log.red('new added player found from tbl :: ');
  //     if (!participant) return this.logError(messages.not_found('participant'), callback);

  //     if (!this.socket.eventNames().includes(iBoardId)) {
  //       const playerListener = new PlayerListener(iBoardId, participant.iUserId);
  //       this.socket.on(iBoardId, playerListener.onEvent.bind(playerListener));
  //     }

  //     if (!board.oSocketId) board.oSocketId = {};
  //     board.oSocketId[participant.iUserId] = this.socket.id;

  //     await board.update({ oSocketId: board.oSocketId });
  //     await _.removeFieldFromArray(participant.gameState.aPlayer, 'sUserToken');
  //     const encryptedDataParticipant = await _.encryptDataGhetiya(JSON.stringify({ oData: participant.gameState }));

  //     // callback(null, { oData: participant.gameState });
  //     callback(null, encryptedDataParticipant);
  //     // if (!isReconnect) {
  //     const encryptedData = await _.encryptDataGhetiya(JSON.stringify(participant.toJSON()));
  //     board.emit('resUserJoined', participant.toJSON());
  //     // board.emit('resUserJoined', encryptedData);
  //     // console.log('🚀 ~ file: player.js:226 ~ participant.toJSON():', participant.toJSON());
  //     // }
  //     participant.stateHandler();
  //   }

  async joinBoard({ iBoardId, isReconnect }, callback) {
    // async joinBoard(oData, callback) {
    // console.log('Very Bad 🚀 ~ file: player.js:91 ~ Player ~ joinBoard ~ oData:', typeof oData);
    // oData = typeof oData === 'string' ? JSON.parse(oData) : oData;
    // let { iBoardId, isReconnect } = oData;
    log.green('Room Join Called:::::::', iBoardId);
    if (!iBoardId) return this.logError(messages.required_field('board id'), callback);

    const board = await boardManager.getBoard(iBoardId);

    if (!board) {
      // const oBoard = await _.getBoardHistory(iBoardId);
      // if (!oBoard.length) return callback(messages.custom.room_deleted);
      // const aWinner = oBoard.sort((a, b) => b.amount - a.amount).map(w => ({ iUserId: w.user_id.toString(), nWinningAmount: w.amount, sUserName: w.user_login_id }));
      return callback({ error: null, oData: { eState: 'finished' } });
    }
    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);

    // TODO reconnection flag from BE side
    // const participantReconnect = board.getParticipant(this.iUserId);
    // if (participantReconnect) {
    //   log.white('participantReconnect :: reconnected ');
    //   isReconnect = true;
    // } else {
    //   isReconnect = false;
    //   log.white('participantReconnect :: new participant.');
    // }

    //* check Schedular Present or Not
    // const schedularPresent = await redis.client.keys(`${iBoardId}:scheduler:assignTurnTimeout:*`);
    // if (isReconnect && !schedularPresent.length) {
    //   log.green('in not Schedular Present condition in REconnect Only.....');
    //   await board.setSchedular('assignTurnTimeout', board.iUserTurn ? board.iUserTurn : this.iUserId, 10000);
    // }
    if (!this.socket.eventNames().includes(iBoardId)) {
      const playerListener = new PlayerListener(iBoardId, participant.iUserId);
      this.socket.on(iBoardId, playerListener.onEvent.bind(playerListener));
    }

    if (!board.oSocketId) board.oSocketId = {};
    board.oSocketId[participant.iUserId] = this.socket.id;

    await board.update({ oSocketId: board.oSocketId });
    
    callback({ error: null, oData: participant.gameState });
    if(!isReconnect) board.emit('resUserJoined', participant.toJSON());

    // emitter.emit('handleState', { iBoardId: board._id });
    participant.stateHandler();
  }
  logError(error, callback = () => {}) {
    log.trace(error);
    callback(error);
  }
  async disconnect() {
    try {
      log.red('Root disconnected', this.iUserId, 'with ', this.socket.id);
      await User.updateOne({ _id: this.iUserId }, { $set: { ePlayerStatus: "offline" } });
    } catch (error) {
      log.trace("disconnect error:::", error);
    }
  }
}

module.exports = Player;
