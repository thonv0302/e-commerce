'use strict';

const express = require('express');
const imageController = require('../../controllers/image.controller');
const router = express.Router();
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// authentication //
router.use(authenticationV2);

router.get('', asyncHandler(imageController.getImages));

router.post(
  '',
  upload.single('file'),
  asyncHandler(imageController.createImage)
);

router.post("/files", upload.array('photos'), asyncHandler(imageController.createImages))

module.exports = router;
