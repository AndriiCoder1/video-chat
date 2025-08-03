/**
 * Message Model
 * 
 * This is a placeholder for a database model. In a production application,
 * you would use a database like MongoDB with Mongoose for schema validation.
 * 
 * For simplicity, we're using an in-memory array in the controller,
 * but this file shows how you might structure a Mongoose schema.
 */

/*
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'sign'],
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);
*/

// For now, we'll use a simple class to represent a message
class Message {
  constructor(id, content, type, userId, username, timestamp = new Date()) {
    this.id = id;
    this.content = content;
    this.type = type; // 'text' or 'sign'
    this.userId = userId;
    this.username = username;
    this.timestamp = timestamp;
  }
  
  static validate(messageData) {
    const { content, type, userId, username } = messageData;
    
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Content is required and must be a string' };
    }
    
    if (!type || !['text', 'sign'].includes(type)) {
      return { valid: false, error: 'Type is required and must be either "text" or "sign"' };
    }
    
    if (!userId || typeof userId !== 'string') {
      return { valid: false, error: 'User ID is required and must be a string' };
    }
    
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required and must be a string' };
    }
    
    return { valid: true };
  }
}

module.exports = Message;