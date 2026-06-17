import Message from '../models/message.model.js';

/**
 * Save a single message to MongoDB
 */
export const saveMessage = async ({ projectId, sender, message }) => {
    if (!projectId || !sender || !message) {
        throw new Error('projectId, sender, and message are required');
    }

    const newMessage = await Message.create({
        projectId,
        sender: {
            _id: sender._id.toString(),
            email: sender.email
        },
        message
    });

    return newMessage;
};

/**
 * Get all messages for a project, oldest first
 */
export const getMessagesByProjectId = async ({ projectId, limit = 100 }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    const messages = await Message.find({ projectId })
        .sort({ createdAt: 1 })   // oldest → newest
        .limit(limit)
        .lean();                   // plain JS objects (faster)

    return messages;
};
