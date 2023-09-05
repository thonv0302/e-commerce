'use strict';
const { BadRequestError, NotFoundError } = require('../core/error.response');
const discountModel = require('../models/discount.model');
const { convertToObjectIdMongodb, removeUndefinedObject } = require('../utils');

const { findAllProducts } = require('../models/repositories/product.repo');

const {
  findAllDiscountCodesUnSelected,
  findAllDiscountCodesSelected,
  checkDiscountExists,
  updateDiscountById,
} = require('../models/repositories/discount.repo');

/*
Discount Services
1 - Generator Discount Code [Shop | Admin]
2 - Get discount amount [User]
3 - Get all discount [User | Shop]
4 - Verify discount code [user]
5 - Delete discount code [Admin | Shop]
6 - Cancel discount code [user]
*/

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
      users_used,
    } = payload;
    // kiem tra
    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError('Discount code has expried!');
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError('Start date must be before end_date');
    }

    // create index for discount code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError('Discount exists!');
    }

    const newDiscount = await discountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type, //percentage
      discount_code: code, // discountCode
      discount_value: value, //10.000, 10
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(start_date), // ngay bat dau
      discount_end_date: new Date(end_date), // ngay ket thuc
      discount_max_uses: max_uses, // so luong discount duoc ap dung
      discount_uses_count: uses_count, // so discount duoc su dung
      discount_users_used: users_used, // ai da su dung
      discount_shopId: shopId,
      discount_max_uses_per_user: max_uses_per_user, // so luong cho phep toi da duoc su dung moi user
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === 'all' ? [] : product_ids, // so san pham duoc ap dung
    });

    return newDiscount;
  }

  static async updateDiscountCode(discountId, payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
      users_used,
    } = payload;
    // kiem tra
    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError('Discount code has expried!');
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError('Start date must be before end_date');
    }

    const updateDiscount = await updateDiscountById({
      discountId,
      bodyUpdate: removeUndefinedObject({
        discount_name: name,
        discount_description: description,
        discount_type: type, //percentage
        discount_code: code, // discountCode
        discount_value: value, //10.000, 10
        discount_min_order_value: min_order_value || 0,
        discount_max_value: max_value,
        discount_start_date: start_date ? new Date(start_date) : '', // ngay bat dau
        discount_end_date: end_date ? new Date(end_date) : '', // ngay ket thuc
        discount_max_uses: max_uses, // so luong discount duoc ap dung
        discount_uses_count: uses_count, // so discount duoc su dung
        discount_users_used: users_used, // ai da su dung
        discount_shopId: shopId,
        discount_max_uses_per_user: max_uses_per_user, // so luong cho phep toi da duoc su dung moi user
        discount_is_active: is_active,
        discount_applies_to: applies_to,
        discount_product_ids: applies_to === 'all' ? [] : product_ids, // so sa
      }),
      model: discountModel,
    });

    return updateDiscount;
  }

  /*
    Get all discount codes avalable with products
  */

  static async getAllDiscountCodesWithProduct({
    code,
    shopId,
    userId,
    limit,
    page,
  }) {
    // create index for discount_code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError('Discount not exist!');
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;

    if (discount_applies_to === 'all') {
      // get all product
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      });
    }

    let products;
    if (discount_applies_to === 'specific') {
      // get the product ids
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      });
    }

    return products;
  }

  //get all discount code of Shop

  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await findAllDiscountCodesUnSelected({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      // unSelect: ['__v', 'discount_shopId'],
      select: ['discount_code', 'discount_name'],
      model: discountModel,
    });

    return discounts;
  }

  /**
   * Apply discount Code
   * products = [
   *  {
   *    productId,
   *    shopId,
   *    quantity,
   *    name,
   *    price
   *  }, {
   *    productId,
   * shopId,
   * quantity,
   * name,
   * price
   * }
   * ]
   */
  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError(`Discount doesn't exist`);
    console.log('foundDiscount: ', foundDiscount);
    const {
      discount_is_active,
      discount_max_uses,
      discount_start_date,
      discount_end_date,
      discount_min_order_value,
      discount_max_uses_per_user,
      discount_users_used,
      discount_type,
      discount_value,
    } = foundDiscount;

    if (!discount_is_active) throw new NotFoundError('Discount expired');
    if (!discount_max_uses) throw new NotFoundError('Discount are out');

    if (
      new Date() < new Date(discount_start_date) ||
      new Date() > new Date(discount_end_date)
    ) {
      throw new NotFoundError('Discount code has expired');
    }

    // check xem co add gia tri toi thieu hay khong
    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      // get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      if (totalOrder < discount_min_order_value) {
        throw new NotFoundError(
          `Discount requires a minmium order value of ${discount_min_order_value}`
        );
      }

      if (discount_max_uses_per_user > 0) {
        const userUserDiscount = discount_users_used.find(
          (user) => user.userId === userId
        );

        if (userUserDiscount) {
          throw new NotFoundError(`Discount already used`);
        }
      }

      // check xem discount laf fixed_amount
      const amount =
        discount_type === 'fixed_amount'
          ? discount_value
          : totalOrder * (discount_value / 100);

      return {
        totalOrder,
        discount: amount,
        totalPrice: totalOrder - amount,
      };
    }
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const foundDiscount = '';
    if (foundDiscount) {
      // deleted
    }
    const deleted = await await discountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }

  // Cancel discount code
  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError(`Discount doesn't exist`);

    const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });

    return result;
  }
}

module.exports = DiscountService;
