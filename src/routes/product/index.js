'use strict';

const express = require('express');
const productController = require('../../controllers/product.controller');
const router = express.Router();
const { asyncHandler } = require('../../auth/checkAuth');
const { authentication2 } = require('../../auth/authUtils');

router.get(
  '/search/:keySearch',
  asyncHandler(productController.getListSearchProduct)
);

// authentication //
router.use(authentication2);
//
router.post('', asyncHandler(productController.createProduct));
router.post(
  '/publish/:id',
  asyncHandler(productController.publishProductByShop)
);
router.post(
  '/unpublish/:id',
  asyncHandler(productController.unPublishProductByShop)
);

// QUERY //
router.get('/drafts/all', asyncHandler(productController.getAllDraftsForShop));
router.get(
  '/published/all',
  asyncHandler(productController.getAllPublishsForShop)
);

module.exports = router;
