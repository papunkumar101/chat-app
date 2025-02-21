const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messageSchema = new Schema({
    sender_id: { type: Number, required: true },
    reciever_id: { type: Number, required: true },
    message_text: { type: String, required: true },
}, { timestamps: true });

module.exports = new messageSchema;