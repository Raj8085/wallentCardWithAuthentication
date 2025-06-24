const mongoose = require('mongoose')

const WalletUserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
})

module.exports = mongoose.model('WalletUser', WalletUserSchema)
