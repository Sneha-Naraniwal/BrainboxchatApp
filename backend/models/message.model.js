import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true,
        index: true
    },
    sender: {
        _id: {
            type: String,   // String to support both ObjectId and 'ai'
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true    // adds createdAt and updatedAt
});

const Message = mongoose.model('message', messageSchema);

export default Message;
