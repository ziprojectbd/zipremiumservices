import mongoose from 'mongoose';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const CHATS_COLLECTION = 'chats';

// GET /chat
export const getChats = asyncHandler(async (req, res) => {
  const { userEmail, listingId, isBrokerChat } = req.query;

  if (!userEmail) {
    return res.status(400).json(error('userEmail query parameter is required'));
  }

  const db = mongoose.connection.db;
  const collection = db.collection(CHATS_COLLECTION);

  const filter = {
    $or: [{ buyerEmail: userEmail }, { sellerEmail: userEmail }],
  };

  if (listingId) {
    filter.listingId = listingId;
  }

  if (isBrokerChat !== undefined && isBrokerChat !== '') {
    filter.isBrokerChat = isBrokerChat === 'true';
  }

  // Calculate the cutoff date: 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  filter.updatedAt = { $gte: sevenDaysAgo };

  try {
    const chats = await collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    // If there were encrypted messages they can be decrypted here.
    // Currently no encryption key is configured so messages are returned as-is.
    // To enable decryption, import CryptoJS and use:
    //   const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    //   const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    return res.json(success(chats));
  } catch (err) {
    return res.status(500).json(error('Failed to fetch chats'));
  }
});

// POST /chat
export const handleChatAction = asyncHandler(async (req, res) => {
  const { action, listingId, buyerEmail, sellerEmail, message, chatId, isBrokerChat } = req.body;

  if (!action) {
    return res.status(400).json(error('Action is required'));
  }

  const db = mongoose.connection.db;
  const collection = db.collection(CHATS_COLLECTION);

  if (action === 'create_chat') {
    if (!listingId || !buyerEmail || !sellerEmail) {
      return res.status(400).json(error('listingId, buyerEmail, and sellerEmail are required to create a chat'));
    }

    // Check for existing active chat (not expired)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existingChat = await collection.findOne({
      listingId,
      buyerEmail,
      sellerEmail,
      updatedAt: { $gte: sevenDaysAgo },
    });

    if (existingChat) {
      return res.json(success(existingChat));
    }

    const newChat = {
      listingId,
      buyerEmail,
      sellerEmail,
      isBrokerChat: isBrokerChat || false,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newChat);
    newChat._id = result.insertedId;

    return res.json(success(newChat));
  }

  if (action === 'send_message') {
    if (!chatId || !buyerEmail || !message) {
      return res.status(400).json(error('chatId, buyerEmail, and message are required to send a message'));
    }

    let chatObjectId;
    try {
      chatObjectId = new mongoose.Types.ObjectId(chatId);
    } catch (err) {
      return res.status(400).json(error('Invalid chatId'));
    }

    const chat = await collection.findOne({ _id: chatObjectId });
    if (!chat) {
      return res.status(404).json(error('Chat not found'));
    }

    // Verify sender belongs to this chat
    if (chat.buyerEmail !== buyerEmail && chat.sellerEmail !== buyerEmail) {
      return res.status(403).json(error('You are not a participant of this chat'));
    }

    // Check if chat has not expired
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (chat.updatedAt && chat.updatedAt < sevenDaysAgo) {
      return res.status(410).json(error('This chat has expired'));
    }

    const newMessage = {
      sender: buyerEmail,
      text: message,
      timestamp: new Date(),
    };

    await collection.updateOne(
      { _id: chatObjectId },
      {
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() },
      }
    );

    return res.json(success(null, 'Message sent'));
  }

  return res.status(400).json(error(`Unknown action: ${action}`));
});
