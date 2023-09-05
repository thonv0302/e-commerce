'use strict';

const DiscountService = require('../services/discount.service');
const { OK, CREATED, SuccessResponse } = require('../core/success.response');

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Code Generations',
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  updateDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful update discount',
      metadata: await DiscountService.updateDiscountCode(
        req.params.discountId,
        {
          ...req.body,
          shopId: req.user.userId,
        }
      ),
    }).send(res);
  };

  getAllDiscountCodes = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Code Found',
      metadata: await DiscountService.getAllDiscountCodesByShop({
        ...req.query,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Code Found',
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res);
  };

  getAllDiscountCodesWithProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Code Found',
      metadata: await DiscountService.getAllDiscountCodesWithProduct({
        ...req.query,
      }),
    }).send(res);
  };
}

module.exports = new DiscountController();
