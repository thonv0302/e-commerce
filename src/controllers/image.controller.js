const ImageService = require('../services/image.service');

const { OK, CREATED, SuccessResponse } = require('../core/success.response');

class ImageController {
  createImage = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create new image success',
      metadata: await ImageService.createImage(req.body),
    }).send(res);
  };
}

module.exports = new ImageController();
