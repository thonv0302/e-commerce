const ImageService = require('../services/image.service');

const { OK, CREATED, SuccessResponse } = require('../core/success.response');

class ImageController {
  createImage = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new image success',
      metadata: await ImageService.createImage({
        ...req.body,
        image_shopId: req.user.userId,
        file: req.file,
      }),
    }).send(res);
  };

  getImages = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get images success',
      metadata: await ImageService.getImages({
        image_shopId: req.user.userId,
        next_cursor: req.query.next_cursor,
        previous_cursor: req.query.previous_cursor,
      }),
    }).send(res);
  };
}

module.exports = new ImageController();
