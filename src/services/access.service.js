'use strict';

const shopModel = require('../models/shop.model');
const bcrypt = require('bcrypt');
const KeyTokenService = require('./keyToken.service');
const { createTokenPair, verifyJWT } = require('../auth/authUtils');
const crypto = require('crypto');
const { getInfoData } = require('../utils');
const {
  BadRequestError,
  ConflictRequestError,
  AuthFailureError,
  ForbiddenError,
} = require('../core/error.response');

const { findByEmail } = require('./shop.service');

const RoleShop = {
  SHOP: 'SHOP',
  WRITER: 'WRITER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
};

class AccessService {
  /**
   * check this token used?
   */
  // handlerRefreshToken = async (refreshToken) => {
  //   // CHECK xem token nay da duoc su dung chua
  //   const foundToken = await KeyTokenService.findByRefreshTokenUsed(
  //     refreshToken
  //   );

  //   if (foundToken) {
  //     // decode xem may la thang nao
  //     const { userId, email } = await verifyJWT(
  //       refreshToken,
  //       foundToken.privateKey
  //     );

  //     console.log({
  //       userId,
  //       email,
  //     });

  //     // xoa tat ca token trong keyStore
  //     await KeyTokenService.deleteKeyById(userId);
  //     throw new ForbiddenError('Something wrong happen !! Pls relogin');
  //   }

  //   const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
  //   if (!holderToken) throw new AuthFailureError('Shop not registered!');

  //   // verifyToken
  //   const { userId, email } = await verifyJWT(
  //     refreshToken,
  //     holderToken.privateKey
  //   );

  //   //  check UserId
  //   const foundShop = await findByEmail({ email });
  //   if (!foundShop) throw new AuthFailureError('Shop not registered!');

  //   // create 1 cap moi
  //   const tokens = await createTokenPair(
  //     { userId, email },
  //     holderToken.publicKey,
  //     holderToken.privateKey
  //   );

  //   // update token
  //   await holderToken.updateOne({
  //     $set: {
  //       refreshToken: tokens.refreshToken,
  //     },
  //     $addToSet: {
  //       refreshTokenUsed: refreshToken,
  //     },
  //   });

  //   return {
  //     user: { userId, email },
  //     tokens,
  //   };
  // };

  // v2
  handlerRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    const { userId, email } = user;
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError('Something wrong happen !! Pls relogin');
    }

    if (keyStore.refreshToken !== refreshToken) {
      throw new AuthFailureError(
        'Your sesion is experied, please login again.'
      );
    }

    const foundShop = await findByEmail({ email });

    if (!foundShop) throw new AuthFailureError('Shop not registered!');

    // create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey
    );

    // update token
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokenUsed: refreshToken,
      },
    });

    return {
      shop: user,
      tokens,
    };
  };

  logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };
  /*
    1- check email
    2- match password
    3- create AT vs RT and save
    4- generate tokens
    5- get data return login
  */
  login = async ({ email, password, refreshToken = null }) => {
    const foundShop = await findByEmail({
      email,
    });
    if (!foundShop) {
      throw new BadRequestError('Error: Shop is not defined!');
    }

    const match = bcrypt.compare(password, foundShop.password);

    if (!match) throw new AuthFailureError('Authentication error');

    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');

    // generate token
    const tokens = await createTokenPair(
      { userId: foundShop._id, email, name: foundShop.name },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      userId: foundShop._id,
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
    });

    return {
      shop: getInfoData({
        fields: ['userId', 'name', 'email'],
        object: { ...foundShop, userId: foundShop._id },
      }),
      tokens,
    };
  };

  signUp = async ({ name, email, password }) => {
    // step1: check email exist?
    const holderShop = await shopModel.findOne({ email }).lean();

    if (holderShop) {
      throw new BadRequestError('Error: Shop already registered!');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      const privateKey = crypto.randomBytes(64).toString('hex');
      const publicKey = crypto.randomBytes(64).toString('hex');

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        return {
          code: 'xxxx',
          message: 'keyStore error',
        };
      }

      // created token pair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );

      return {
        shop: getInfoData({
          fields: ['userId', 'name', 'email'],
          object: { ...newShop, userId: newShop._id },
        }),
        tokens,
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = new AccessService();
