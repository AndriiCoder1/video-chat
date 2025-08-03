const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// @route   GET api/messages
// @desc    Get all messages
// @access  Public
router.get('/', messageController.getMessages);

// @route   POST api/messages
// @desc    Create a new message
// @access  Public
router.post('/', messageController.createMessage);

// @route   GET api/messages/sign-to-text
// @desc    Convert sign language to text (placeholder for ML integration)
// @access  Public
router.post('/sign-to-text', messageController.signToText);

// @route   GET api/messages/text-to-sign
// @desc    Convert text to sign language animation data
// @access  Public
router.post('/text-to-sign', messageController.textToSign);

// @route   POST api/messages/ai-chat
// @desc    AI chat endpoint for responding to user messages
// @access  Public
router.post('/ai-chat', messageController.aiChat);

module.exports = router;