'use strict';

const ProductService = require('../services/product.service');
const ProductServiceV2 = require('../services/product.service.xxx');
const { OK, CREATED, SuccessResponse } = require('../core/success.response');
class AccessController {
  createProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new product success.',
      metadata: await ProductServiceV2.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  // update Product
  updateProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update product success.',
      metadata: await ProductServiceV2.updateProduct(
        req.body.product_type,
        req.params.productId,
        {
          ...req.body,
          product_shop: req.user.userId,
        }
      ),
    }).send(res);
  };

  // QUERY //
  /**
   * @desc Get all Draft for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list draft success!',
      metadata: await ProductServiceV2.findAllDraftsForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  getAllPublishsForShop = async (req, res, next) => {
    console.log('vao day 1');

    new SuccessResponse({
      message: 'Get list publish success!',
      metadata: await ProductServiceV2.findAllPublishsForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  publishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Publish product success!',
      metadata: await ProductServiceV2.publishProductByShop({
        product_id: req.params.id,
        product_shop: req.user.userId,
      }),
    }).send(res);
  };
  // END QUERY //

  unPublishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Unpublish product success!',
      metadata: await ProductServiceV2.unPublishProductByShop({
        product_id: req.params.id,
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  getListSearchProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list search product success!',
      metadata: await ProductServiceV2.getListSearchProduct(req.params),
    }).send(res);
  };

  findAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list product success!',
      metadata: await ProductServiceV2.findAllProducts(req.query),
    }).send(res);
  };

  findProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list product success!',
      metadata: await ProductServiceV2.findProduct({
        product_id: req.params.product_id,
      }),
    }).send(res);
  };

  getAllProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get list product shop success!',
      metadata: await ProductServiceV2.findAllProductShop({
        product_shop: req.user.userId,
        ...req.query
      }),
    }).send(res);
  };
}

module.exports = new AccessController();
