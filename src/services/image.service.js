const imageModel = require('../models/image.model');
const { uploadFile } = require('../helpers/awsS3');
const { Types } = require('mongoose');
const { BadRequestError } = require('../core/error.response');

class ImageService {
  static async createImage(payload) {
    const { image_shopId, belong, file } = payload;

    let newImage;
    try {
      const { fileName } = await uploadFile({
        key: file.originalname,
        body: file.buffer,
        mimetype: file.mimetype,
      });

      newImage = await imageModel.create({
        name: file.originalname,
        image_shopId,
        url: fileName,
        size: file.size,
        type: file.mimetype,
        belong,
      });
    } catch (error) {
      //-- delete image s3 bucket
      throw new BadRequestError('Error: there something wrong!');
    }

    return newImage;
  }

  static async getImages({ image_shopId, next_cursor, previous_cursor }) {
    const objQuery = {
      image_shopId,
    };

    if (next_cursor) {
      objQuery._id = { $lt: new Types.ObjectId(next_cursor) };
    }

    if (previous_cursor) {
      objQuery._id = {
        $gt: new Types.ObjectId(previous_cursor),
      };
    }

    const data = await imageModel
      .find(objQuery)
      .sort({
        _id: -1,
      })
      .limit(1);

    let hasNext, hasPrev, lastItem, firstItem;

    if (data.length) {
      lastItem = data[data.length - 1]._id;
      firstItem = data[0]._id;

      const q = { _id: { $lt: lastItem } };
      const r = await imageModel.findOne(q);

      if (r) {
        hasNext = true;
      }

      q._id = {
        $gt: firstItem,
      };
      hasPrev = !!(await imageModel.findOne(q));
    }

    const dataStructure = {
      uploadedImages: {
        pageInfo: {
          next_cursor: null,
          previous_cursor: null,
        },
        edges: data,
      },
    };

    if (hasNext) {
      dataStructure.uploadedImages.pageInfo.next_cursor = `${lastItem}`;
    }
    if (hasPrev) {
      dataStructure.uploadedImages.pageInfo.previous_cursor = `${firstItem}`;
    }
    return dataStructure;
  }
}

module.exports = ImageService;
