'use strict';

const {
  product,
  electronic,
  clothing,
  furniture,
} = require('../../models/product.xxx.model');
const {
  getSelectData,
  unGetSelectData,
  convertToObjectIdMongodb,
} = require('../../utils');

const { Types } = require('mongoose');

const findAllDraftsForShop = async ({ query, pageSize, pageNumber }) => {
  return await queryProduct({ query, pageSize, pageNumber });
};

const findAllPublishsForShop = async ({ query, pageSize, pageNumber }) => {
  return await queryProduct({ query, pageSize, pageNumber });
};

const findAllProductForShop = async ({ query, pageSize, pageNumber }) => {
  return await queryProduct({ query, pageSize, pageNumber });
};

const publishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });

  if (!foundShop) return null;

  foundShop.isDraft = false;
  foundShop.isPublished = true;

  const { modifiedCount } = await foundShop.updateOne(foundShop);

  return modifiedCount;
};

const unPublishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });

  if (!foundShop) return null;

  foundShop.isDraft = true;
  foundShop.isPublished = false;

  const { modifiedCount } = await foundShop.updateOne(foundShop);

  return modifiedCount;
};

const searchProductByUser = async ({ keySearch }) => {
  const regexSearch = new RegExp(keySearch);
  const results = await product
    .find(
      {
        isPublished: true,
        $text: {
          $search: regexSearch,
        },
      },
      {
        score: {
          $meta: 'textScore',
        },
      }
    )
    .sort({
      score: {
        $meta: 'textScore',
      },
    })
    .lean();

  return results;
};

const findAllProducts = async ({ limit, sort, page, filter, select }) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
  const products = await product
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return products;
};

const findProduct = async ({ product_id, unSelect }) => {
  return await product.findById(product_id).select(unGetSelectData(unSelect));
};

const updateProductById = async ({
  productId,
  bodyUpdate,
  model,
  isNew = true,
}) => {
  return await model.findByIdAndUpdate(productId, bodyUpdate, {
    new: isNew,
  });
};

const queryProduct = async ({ query, pageSize, pageNumber }) => {
  const skip = (pageNumber - 1) * pageSize; // Calculate the number of documents to skip
  const products = await product
    .find(query)
    .populate('product_shop', 'name email -_id')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(pageSize) // Add this to limit the number of results per page
    .lean()
    .exec();

  const totalRecords = await product.countDocuments(query);

  return { products, totalRecords };
};

const getProductById = async (productId) => {
  return await product
    .findOne({ _id: convertToObjectIdMongodb(productId) })
    .lean();
};

const checkProductByServer = async (products) => {
  return await Promise.all(
    products.map(async (product) => {
      const foundProduct = await getProductById(product.productId);
      if (foundProduct) {
        return {
          price: foundProduct.product_price,
          quantity: product.quantity,
          productId: product.productId,
        };
      }
    })
  );
};

module.exports = {
  findAllDraftsForShop,
  publishProductByShop,
  findAllPublishsForShop,
  findAllProductForShop,
  unPublishProductByShop,
  searchProductByUser,
  findAllProducts,
  findProduct,
  updateProductById,
  getProductById,
  checkProductByServer,
};
