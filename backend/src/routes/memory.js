const express = require('express');
const router = express.Router();
const memoryService = require('../services/memory.service');

// GET /api/memory
router.get('/', async (req, res) => {
  try {
    const memory = await memoryService.getMemory(req.logosUser.id);
    res.json(memory);
  } catch (err) {
    console.error('GET /api/memory error:', err);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// DELETE /api/memory
router.delete('/', async (req, res) => {
  try {
    await memoryService.resetMemory(req.logosUser.id);
    res.json({ status: 'memory_reset' });
  } catch (err) {
    console.error('DELETE /api/memory error:', err);
    res.status(500).json({ error: 'Failed to reset memory' });
  }
});

module.exports = router;
