const mongoose = require('mongoose');

const aviatorGameSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    players: [{ userId: String, amount: Number }],
    multiplier: { type: Number, default: 1 },
    status: { type: String, enum: ['waiting', 'in-progress', 'finished'], default: 'waiting' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GameRounds', aviatorGameSchema);