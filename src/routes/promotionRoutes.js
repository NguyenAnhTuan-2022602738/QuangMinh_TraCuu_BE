const express = require('express');
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', promotionController.getPromotion);
router.put('/', authMiddleware, promotionController.upsertPromotion);

module.exports = router;
