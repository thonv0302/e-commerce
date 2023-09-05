'use strict';

const express = require('express');
const discountController = require('../../controllers/discount.controller');
const router = express.Router();
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// get amount a discount
router.post('/amount', asyncHandler(discountController.getDiscountAmount));
router.get(
  '/list_product_code',
  asyncHandler(discountController.getAllDiscountCodesWithProducts)
);

// authentication //
router.use(authenticationV2);

router.get('', asyncHandler(discountController.getAllDiscountCodes));
router.post('', asyncHandler(discountController.createDiscountCode));
router.patch(
  '/:discountId',
  asyncHandler(discountController.updateDiscountCode)
);

module.exports = router;
