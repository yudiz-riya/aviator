// const boardManager = require('../../game/BoardManager');
const { User, Setting } = require('../../models');
const { queue } = require('../../utils');
class PlayerListener {
  constructor(iBoardId, iUserId) {
    this.iBoardId = iBoardId;
    this.iUserId = iUserId;
  }
  logError(error, callback) {
    // eslint-disable-next-line no-console
    return callback(error);
  }
  onEvent(oDataa, callback = () => {}) {
    // console.log('Very Bad 🚀 ~ file: listener.js:40 ~ PlayerListener ~ onEvent ~ oData:', typeof oDataa);
    // if (process.env.NODE_ENV === 'dev' && typeof body === 'object') body = _.stringify(body); // For postman use

    // const parseBody = _.parse(body);
    const { sEventName, oData } = typeof oDataa === 'string' ? JSON.parse(oDataa) : oDataa;
    log.cyan('## sEventName in onEvent :: ', sEventName, '::', oData, '::', this.iBoardId);
    switch (sEventName) {
      case 'reqMovePawn':
        // const eventData = JSON.parse(await _.decryptDataGhetiya(oData));
        // this.movePawn(eventData, callback);
        this.movePawn(oData, callback);
        break;
      case 'reqRollDice':
        this.rollDice(oData, callback);
        break;
      case 'reqChangeTurn':
        this.changeTurn(oData, callback);
        break;
      case 'reqLeave':
        this.leave(oData, callback);
        break;
      case 'reqPowerUp':
        this.powerUp(oData, callback);
        break;
      case 'reqSendEmoji':
        this.sendEmoji(oData, callback);
        break;
      case 'reqUpdateAgoraId':
        this.updateAgoraId(oData, callback);
        break;
      case 'reqInviteFriend':
        this.inviteFriend(oData, callback);
        break;
      case 'reqPrivateChat':
        this.privateChat(oData, callback);
        break;
      case 'reqBoardChat':
        this.boardChat(oData, callback);
        break;
      default:
        log.red('unknown event', sEventName);
        break;
    }
  }
  async movePawn(oData, callback = () => {}) {
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);
    if (!participant.hasValidTurn()) return this.logError(messages.custom.wait_for_turn, callback);

    participant.movePawn(oData, (error, data) => {
      if (error) return callback(error);
      if (typeof callback === 'function') callback({ error: null, oData: data });
    });

    // participant.movePawn(oData, async (error, data) => {
    //   if (error) return callback(error);
    //   const encryptedData = await _.encryptDataGhetiya(JSON.stringify(data));

    //   if (typeof callback === 'function') callback(null, encryptedData);
    // });
  }
  async rollDice(oData, callback) {
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);
    if (!participant.hasValidTurn()) return this.logError(messages.custom.wait_for_turn, callback);

    board.rollDice(oData, (error, data) => {
      if (error) return callback(error);
      if (typeof callback === 'function') callback({ error: null, oData: data });
      callback({ error: null, oData: data });
    });
    // board.rollDice(oData, async (error, data) => {
    //   if (error) return callback(error);
    //   const encryptedData = await _.encryptDataGhetiya(JSON.stringify(data));
    //   if (typeof callback === 'function') callback(null, encryptedData);
    //   callback(null, encryptedData);
    // });
  }
  async powerUp(oData, callback) {
    console.log("🚀 ~ file: listener.js:99 ~ PlayerListener ~ powerUp ~ oData:", oData)
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);

    const { id } = oData;
    log.green('powerUp called with powerup ID :: ', id);
    const isUsed = participant.aPowerUp.find(p => p.id === parseInt(id))?.eState !== 'notUsed';

    if (isUsed) return this.logError(messages.custom.power_up_used, callback);

    for (const powerUp of participant.aPowerUp) {
      if (powerUp.id !== parseInt(id) && powerUp.eState === 'using') {
        powerUp.eState = 'notUsed'; // unSelect previous selected powerup.
        log.cyan('previous powerup unselected :: ', powerUp);
      }
      if (powerUp.id === parseInt(id)) powerUp.eState = 'using';
    }

    await board.update({ aParticipant: [participant.toJSON()] });
    await board.emit('resPowerUp', { iUserId: this.iUserId, iPowerId: id });
    if (typeof callback === 'function') callback({ error: null, oData: participant.toJSON().aPowerUp });
  }
  async changeTurn(oData, callback) {
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);

    participant.passTurn();
  }
  async leave(oData, callback) {
    log.red('## leave table called from user ', this.iUserId);
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);
    // if (!board.isExit && board.eState !== 'waiting') return callback("Can't leave at this stage", { oData: { eState: 'playing' } });

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);

    queue.addJob(this.iBoardId, { sEventName: 'reqLeave', iBoardId: this.iBoardId, iUserId: this.iUserId });
  }
  async sendEmoji(oData, callback) {
    // const board = await boardManager.getBoard(this.iBoardId);
    // if (!board) return this.logError(messages.not_found('Board'), callback);
    // const participant = board.getParticipant(this.iUserId);
    // if (!participant) return this.logError(messages.not_found('participant'), callback);
    // await board.emit('resSendEmoji', oData);
    log.green('sendEmoji called', oData); // { "emoji": 0, "iReceiverId": "614d8da73514438d8b0f40ac" }
    if (!oData.emoji) oData.emoji = 0;
    oData.emoji = parseInt(oData.emoji, 10) || 0;
    if (!oData.iReceiverId) return this.logError(messages.required_field('iReceiverId'), callback);

    if (!this.iUserId) return this.logError(messages.not_found('user'), callback);
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('board'), callback);

    const [user, setting] = await Promise.all([
        User.findOne({ _id: mongify(this.iUserId) }, { _id: 1, sUserName: 1, nChips: 1 }),
        Setting.findOne({}, { _id: 0, aEmojiCost: 1 }).lean(), //
    ]);
    if (!user) return this.logError(messages.not_found('user'), callback);
    if (!setting) return this.logError(messages.not_found('setting'), callback);
    if (Number.isNaN(setting.aEmojiCost[oData.emoji])) return this.logError(messages.not_found('emoji'), callback);
    const cost = setting.aEmojiCost.find((c) => c.nEmojiId === oData.emoji)?.nCost || 0;
    if (user.nChips < cost) return callback(messages.insufficient_chips('You Have'));
    user.nChips -= cost;
    await user.save();
    _.privateEmit(this.iUserId, 'resUpdateCoins', { nChips: parseInt(user.nChips, 10) });
    await board.emit('resSendEmoji', { ...oData, iSenderId: this.iUserId });
    callback({ error: null, oData: oData });
  }

  async updateAgoraId(oData, callback) {
    const { sAgoraId } = oData;
    const board = await boardManager.getBoard(this.iBoardId);
    if (!board) return this.logError(messages.not_found('Board'), callback);

    const participant = board.getParticipant(this.iUserId);
    if (!participant) return this.logError(messages.not_found('participant'), callback);

    participant.sAgoraId = sAgoraId;
    await board.update({ aParticipant: [participant.toJSON()] });
    callback({ error: null, oData: oData });
    const response = board.toJSON()?.aParticipant?.map((p) => ({ iUserId: p?.iUserId, sAgoraId: p?.sAgoraId }));
    log.yellow('resUpdateAgoraId::::::', response);
    await board.emit('resUpdateAgoraId', response || {});
  }

  async inviteFriend(oData, callback) {
    try {
      // const board = await boardManager.getBoard(this.iBoardId);
      // if (!board) return this.logError(messages.not_found('Board'), callback);

      const user = await User.findOne({ _id: oData.iReceiverId }, { sRootSocket: true }).lean();
      if (!user) {
        log.red('receiver not found :: ', oData.iReceiverId);
        return this.logError(messages.not_found('Receiver User'), callback);
      }

      const setting = await Setting.findOne({}, { _id: false, nFriendInviteTimeout: true }).lean();
      oData.timeout = setting.nFriendInviteTimeout * 1000;

      global.io.to(user.sRootSocket).emit(this.iBoardId, { sEventName: 'resInvite', oData });
    } catch (e) {
      log.red('error from inviteFriend :: ', e.toString());
    }
  }

  async privateChat(oData, callback) {
    try {
      const board = await boardManager.getBoard(this.iBoardId);
      if (!board) return this.logError(messages.not_found('Board'), callback);

      const participant = board.getParticipant(oData.iReceiverId);
      if (!participant) return this.logError(messages.not_found('participant'), callback);

      global.io.to(participant.sRootSocket).emit(this.iBoardId, { sEventName: 'resPrivateChat', oData });

      await Chat.create({
        iBoardId: this.iBoardId,
        iSenderId: oData.iSenderId,
        iReceiverId: oData.iReceiverId,
        sMessage: oData.sMessage,
      });
    } catch (e) {
      log.red('error from privateChat :: ', e.toString());
    }
  }

  async boardChat(oData, callback) {
    try {
      const board = await boardManager.getBoard(this.iBoardId);
      if (!board) return this.logError(messages.not_found('Board'), callback);

      await board.emit('resBoardChat', { oData });

      await Chat.create({
        iBoardId: this.iBoardId,
        iSenderId: oData.iSenderId,
        sMessage: oData.sMessage,
      });
    } catch (e) {
      log.red('error from boardChat :: ', e.toString());
    }
  }
}
module.exports = PlayerListener;
