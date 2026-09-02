const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { notifyUser } = require("../utils/notify");

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "firstName lastName avatar")
    .populate("animal", "name images")
    .sort({ lastMessageAt: -1 });

  const withUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        receiver: req.user._id,
        read: false,
      });
      return { ...conversation.toObject(), unreadCount };
    })
  );

  res.json(withUnread);
});

const getConversationInfo = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId)
    .populate("participants", "firstName lastName avatar")
    .populate("animal", "name images");
  if (!conversation) {
    res.status(404);
    throw new Error("Conversation introuvable");
  }
  res.json(conversation);
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });
  await Message.updateMany(
    { conversation: conversationId, receiver: req.user._id, read: false },
    { read: true }
  );
  res.json(messages);
});

// Opens (or reuses) a conversation without sending a message — used by the
// "Contacter" buttons on animal/report details, so the recipient doesn't
// receive a canned auto-generated first message before the user has
// actually written anything.
const startConversation = asyncHandler(async (req, res) => {
  const { receiverId, animalId } = req.body;

  const receiver = await User.findById(receiverId).select("blockedUsers");
  const sender = await User.findById(req.user._id).select("blockedUsers");
  if (sender.blockedUsers.some((id) => id.toString() === receiverId)) {
    res.status(403);
    throw new Error("Vous avez bloqué cet utilisateur. Débloquez-le pour lui écrire.");
  }
  if (receiver?.blockedUsers.some((id) => id.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error("Cette conversation n'est pas disponible.");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, receiverId] },
    animal: animalId || undefined,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, receiverId],
      animal: animalId || undefined,
    });
  }

  res.status(200).json(conversation);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message, animalId, conversationId } = req.body;

  const [sender, receiver] = await Promise.all([
    User.findById(req.user._id).select("blockedUsers firstName"),
    User.findById(receiverId).select("blockedUsers"),
  ]);

  const senderBlockedReceiver = sender.blockedUsers.some((id) => id.toString() === receiverId);
  const receiverBlockedSender = receiver?.blockedUsers.some((id) => id.toString() === req.user._id.toString());
  if (senderBlockedReceiver) {
    res.status(403);
    throw new Error("Vous avez bloqué cet utilisateur. Débloquez-le pour lui écrire.");
  }
  if (receiverBlockedSender) {
    res.status(403);
    throw new Error("Ce message ne peut pas être envoyé.");
  }

  let conversation = conversationId ? await Conversation.findById(conversationId) : null;

  if (!conversation) {
    conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      animal: animalId || undefined,
    });
  }

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, receiverId],
      animal: animalId || undefined,
    });
  }

  const newMessage = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    receiver: receiverId,
    message,
  });

  conversation.lastMessage = message;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const io = req.app.get("io");
  if (io) {
    io.to(receiverId).emit("newMessage", newMessage);
  }

  res.status(201).json(newMessage);

  notifyUser(receiverId, {
    type: "message",
    title: sender.firstName || "Nouveau message",
    body: message.length > 80 ? `${message.slice(0, 80)}…` : message,
    data: { conversationId: conversation._id.toString() },
  }).catch((error) => console.error("Notify (new message) failed:", error.message));
});

module.exports = { getConversations, getConversationInfo, getMessages, startConversation, sendMessage };
