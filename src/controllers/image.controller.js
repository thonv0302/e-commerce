const ImageService = require('../services/image.service');

const { OK, CREATED, SuccessResponse } = require('../core/success.response');

class ImageController {
  createImage = async (req, res, next) => {
    console.log('req.user: ', req.user);
    new SuccessResponse({
      message: 'Create new image success',
      metadata: await ImageService.createImage({ ...req.body, image_shopId: req.user.userId }),
    }).send(res);
  };
}

module.exports = new ImageController();
