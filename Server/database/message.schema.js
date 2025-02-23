const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messageSchema = new schema({
    sender_id: { type: String, required: true },
    receiver_id: { type: String, required: true },
    message_text: { type: String, required: true },
}, { timestamps: true });

const Message = mongoose.model('message', messageSchema);
module.exports = Message;