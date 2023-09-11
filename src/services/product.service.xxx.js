'use strict';
const { BadRequestError } = require('../core/error.response');

const {
  product,
  clothing,
  electronic,
  furniture,
} = require('../models/product.xxx.model.js');
const { insertInventory } = require('../models/repositories/inventory.repo');
const {
  findAllDraftsForShop,
  publishProductByShop,
  findAllProductForShop,
  findAllPublishsForShop,
  searchProductByUser,
  unPublishProductByShop,
  findAllProducts,
  findProduct,
  updateProductById,
} = require('../models/repositories/product.repo');

const {
  removeUndefinedObject,
  updateNestedObjectParser,
} = require('../utils/index');

// define Factory class to create product

function removeFalsyValues(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(removeFalsyValues)
      .filter(value => value !== null && value !== undefined && (typeof value !== 'object' || Object.keys(value).length > 0));
  }

  return Object.entries(obj)
    .reduce((acc, [key, value]) => {
      const cleanedValue = removeFalsyValues(value);
      if (
        cleanedValue !== null &&
        cleanedValue !== undefined &&
        (typeof cleanedValue !== 'object' || Object.keys(cleanedValue).length > 0) &&
        !Number.isNaN(cleanedValue)
      ) {
        acc[key] = cleanedValue;
      }
      return acc;
    }, {});
}

class ProductFactory {
  static productRegistry = {};

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef;
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!type) throw new BadRequestError(`Invalid Product Types ${type}`);
    return new productClass(payload).createProduct();
  }

  static async updateProduct(type, productId, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!type) throw new BadRequestError(`Invalid Product Types ${type}`);
    return new productClass(payload).updateProduct(productId);
  }

  static async publishProductByShop({ product_shop, product_id }) {
    return await publishProductByShop({
      product_shop,
      product_id,
    });
  }

  static async unPublishProductByShop({ product_shop, product_id }) {
    return await unPublishProductByShop({
      product_shop,
      product_id,
    });
  }

  static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isDraft: true };
    return await findAllDraftsForShop({
      query,
      limit,
      skip,
    });
  }

  static async findAllPublishsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isPublished: true };
    return await findAllPublishsForShop({
      query,
      limit,
      skip,
    });
  }

  static async findAllProductShop({ product_shop, limit = 50, skip = 0, sortInventory,
    sortPrice,
    sortDate,
    search }) {
    console.log('search: ', search);
    const query = removeFalsyValues({
      product_shop,
      product_name: {
        $regex: search,
      }
    })
    const sort = removeFalsyValues({
      product_quantity: +sortInventory,
      product_price: +sortPrice,
      createdAt: +sortDate,

    })
    console.log('query: ', query);
    console.log('sort: ', sort);
    return await findAllProductForShop({
      query,
      sort,
      limit,
      skip,
    });
  }

  static async getListSearchProduct({ keySearch }) {
    return await searchProductByUser({ keySearch });
  }

  static async findAllProducts({
    limit = 50,
    sort = 'ctime',
    page = 1,
    filter = { isPublished: true },
  }) {
    return await findAllProducts({
      limit,
      sort,
      filter,
      page,
      select: [
        'product_name',
        'product_price',
        'product_thumb',
        'product_shop',
      ],
    });
  }

  static async findProduct({ product_id }) {
    return await findProduct({ product_id, unSelect: ['__v'] });
  }
}

// define base product class
class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_quantity,
    product_type,
    product_shop,
    product_attributes,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_description = product_description;
    this.product_price = product_price;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_shop = product_shop;
    this.product_attributes = product_attributes;
  }

  // create new product
  async createProduct(product_id) {
    const newProduct = await product.create({ ...this, _id: product_id });
    if (newProduct) {
      // add product_stock in inventory collection
      await insertInventory({
        productId: newProduct._id,
        shopId: this.product_shop,
        stock: this.product_quantity,
      });
    }

    return newProduct;
  }

  // update Product
  async updateProduct(productId, bodyUpdate) {
    return await updateProductById({ productId, bodyUpdate, model: product });
  }
}

// Define sub-class for different product types Clothing
class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newClothing) throw new BadRequestError('create new Clothing error');

    const newProduct = await super.createProduct(newClothing._id);
    if (!newProduct) throw new BadRequestError('create new Product error');

    return newProduct;
  }

  async updateProduct(productId) {
    // 1. remove attr has null undefined
    // 2. check xem update o cho nao
    const objectParams = removeUndefinedObject(this);

    if (objectParams.product_attributes) {
      // update child
      await updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
        model: clothing,
      });
    }

    const updateProduct = await super.updateProduct(
      productId,
      updateNestedObjectParser(objectParams)
    );

    return updateProduct;
  }
}

// Define sub-class for different product types Electronics
class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newElectronic)
      throw new BadRequestError('create new Electronic error');

    const newProduct = await super.createProduct(newClothing._id);
    if (!newProduct) throw new BadRequestError('create new Product error');

    return newProduct;
  }

  async updateProduct(productId) {
    // 1. remove attr has null undefined
    // 2. check xem update o cho nao
    const objectParams = removeUndefinedObject(this);
    if (objectParams.product_attributes) {
      // update child
      await updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
        model: electronic,
      });
    }

    const updateProduct = await super.updateProduct(
      productId,
      updateNestedObjectParser(objectParams)
    );

    return updateProduct;
  }
}

class Furniture extends Product {
  async createProduct() {
    const newFurniture = await furniture.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    });
    if (!newFurniture) throw new BadRequestError('create new Furniture error');

    const newProduct = await super.createProduct(newFurniture._id);
    if (!newProduct) throw new BadRequestError('create new Product error');

    return newProduct;
  }

  async updateProduct(productId) {
    // 1. remove attr has null undefined
    // 2. check xem update o cho nao
    const objectParams = removeUndefinedObject(this);
    if (objectParams.product_attributes) {
      // update child
      await updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
        model: furniture,
      });
    }

    const updateProduct = await super.updateProduct(
      productId,
      updateNestedObjectParser(objectParams)
    );

    return updateProduct;
  }
}

// register product types
ProductFactory.registerProductType('Electronics', Electronics);
ProductFactory.registerProductType('Clothing', Clothing);
ProductFactory.registerProductType('Furniture', Furniture);

module.exports = ProductFactory;
