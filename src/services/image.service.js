const imageModel = require('../models/image.model');
const { uploadFile, getFileUrl, uploadFiles } = require('../helpers/awsS3');
const { BadRequestError } = require('../core/error.response');
const { queryImage } = require('../models/repositories/image.repo');

class ImageService {
  static async createImage(payload) {
    const { image_shopId, belong, file } = payload;

    try {
      const url = await uploadFile({
        key: file.originalname,
        body: file.buffer,
        mimetype: file.mimetype,
      });
      const newImage = await imageModel.create({
        name: file.originalname,
        image_shopId,
        url: url,
        size: file.size,
        type: file.mimetype,
        belong,
      });
      return newImage;
    } catch (error) {
      //-- delete image s3 bucket
      throw new BadRequestError('Error: there something wrong!');
    }
  }

  static async createImages(payload) {
    const { image_shopId, belong, files } = payload;
    try {
      const urls = await uploadFiles(files);
      const newFiles = files.map((file, idx) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        belong,
        image_shopId,
        url: urls[idx],
      }));
      const newImage = await imageModel.insertMany(newFiles);
      return newImage;
    } catch (error) {
      throw new BadRequestError('Error: there something wrong!');
    }
  }

  static async getImages({
    image_shopId,
    next_cursor,
    previous_cursor,
    belong,
  }) {
    const objQueryImages = {
      image_shopId,
    };

    let result1, result2;
    if (!belong) {
      [result1, result2] = await Promise.all([
        queryImage({
          query: { ...objQueryImages, belong: 'shop' },
          next_cursor,
          previous_cursor,
        }),
        queryImage({
          query: { ...objQueryImages, belong: 'product' },
          next_cursor,
          previous_cursor,
        }),
      ]);
    }

    if (belong === 'shop') {
      result1 = await queryImage({
        query: { ...objQueryImages, belong: 'shop' },
        next_cursor,
        previous_cursor,
      });
    }

    if (belong === 'product') {
      result2 = await queryImage({
        query: { ...objQueryImages, belong: 'product' },
        next_cursor,
        previous_cursor,
      });
    }

    const dataStructure = {
      uploadedImages: { ...result1, belong: 'shop' },
      productImages: { ...result2, belong: 'product' },
    };

    return dataStructure;
  }
}

module.exports = ImageService;
