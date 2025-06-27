const { ethers } = require('ethers')
const WalletUser = require('../models/WalletUser')

// Generate a random nonce
const generateNonce = () => Math.floor(Math.random() * 1000000).toString()


exports.getNonce = async (req, res) => {
  const { address } = req.query
  if (!address) return res.status(400).json({ error: 'Wallet address is required' })

  const lowerAddr = address.toLowerCase()
  let user = await WalletUser.findOne({ address: lowerAddr })

  const nonce = generateNonce()

  if (user) {
    user.nonce = nonce
    await user.save()
  } else {
    user = await WalletUser.create({ address: lowerAddr, nonce })
  }

  res.json({ nonce })
}

exports.verifySignature = async (req, res) => {
  const { address, message, signature } = req.body
  if (!address || !message || !signature) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const lowerAddr = address.toLowerCase()
  const user = await WalletUser.findOne({ address: lowerAddr })

  if (!user) {
    return res.status(404).json({ error: 'Wallet not registered' })
  }

  const expectedMessage = `Sign to login. Your code: ${user.nonce}`

  try {
    const signer = ethers.verifyMessage(expectedMessage, signature).toLowerCase()

    if (signer !== lowerAddr) {
      return res.status(401).json({ error: 'Signature mismatch' })
    }

    return res.status(200).json({ success: true, address: signer })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
