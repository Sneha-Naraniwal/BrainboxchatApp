import { getMessagesByProjectId } from '../services/message.service.js';
import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';

/**
 * GET /messages/:projectId
 * Returns chat history for a project.
 * Only members of the project can fetch messages.
 */
export const getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }

        // Ensure the requesting user belongs to this project
        const project = await projectModel.findOne({
            _id: projectId,
            users: req.user._id
        });

        if (!project) {
            return res.status(403).json({ error: 'Access denied: you are not a member of this project' });
        }

        const messages = await getMessagesByProjectId({ projectId });

        return res.status(200).json({ messages });

    } catch (error) {
        console.error('getMessages error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
