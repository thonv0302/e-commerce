'use strict';

const express = require('express');
const imageController = require('../../controllers/image.controller');
const router = express.Router();
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// authentication //
router.use(authenticationV2);
router.post('', asyncHandler(imageController.createImage));

module.exports = router;
