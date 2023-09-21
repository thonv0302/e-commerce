const imageModel = require('../models/image.model');

class ImageService {
  static async createImage(payload) {
    const { name, image_shopId, url, size, type, belong } = payload;
    const newImage = await imageModel.create({
      name,
      image_shopId,
      url,
      size,
      type,
      belong,
    });

    return newImage;
  }
}

module.exports = ImageService;
