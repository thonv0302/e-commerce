'use strict';

const JWT = require('jsonwebtoken');
const asyncHandler = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findByUserId } = require('../services/keyToken.service');

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id',
};

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    //accessToken
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: 60,
    });

    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: '7 days',
    });

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.log(`error verify::`, err);
      } else {
        console.log(`decode verify::`, decode);
      }
    });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {}
};

const authenticationV2 = asyncHandler(async (req, res, next) => {
  /**
   * 1 - Check userId missing??
   * 2 - Get accessToken
   * 3 - VerifyToken
   * 4 - Check user in bds?
   * 5 - Check keyStore with this userId
   * 6 - Ok all => return next()
   */
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError('Invalid Request');

  //2
  const keyStore = await findByUserId(userId);
  if (!keyStore) throw new NotFoundError('Not found keyStore');
  //3
  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = JWT.verify(
        refreshToken,
        keyStore.privateKey.toString()
      );

      if (userId !== decodeUser.userId)
        throw new AuthFailureError('Invalid Userid');

      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;
      return next();
    } catch (error) {
      throw error;
    }
  }

  const accessToken = req.headers[HEADER.AUTHORIZATION].split(' ')[1];
  if (!accessToken) throw new AuthFailureError('Invalid Request');

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey.toString());
    if (userId !== decodeUser.userId)
      throw new AuthFailureError('Invalid Userid');
    req.keyStore = keyStore;
    req.user = decodeUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthFailureError('Jwt Expired');
    }
    throw error;
  }
});

const verifyJWT = async (token, keyScret) => {
  return await JWT.verify(token, keyScret);
};

module.exports = {
  createTokenPair,
  authenticationV2,
  verifyJWT,
};
