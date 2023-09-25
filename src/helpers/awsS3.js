const {
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
  signatureVersion,
} = require('../configs/config.aws');
const crypto = require('crypto');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  signatureVersion,
});

const generateFileName = (key, bytes = 32) => {
  const ext = key.substring(key.lastIndexOf('.'), key.length);
  return crypto.randomBytes(bytes).toString('hex') + ext;
};

const uploadFile = async ({ body, key, mimetype }) => {
  const fileName = generateFileName(key);
  const uploadParams = {
    Bucket: bucket,
    Body: body,
    Key: fileName,
    ContentType: mimetype,
  };

  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);

  return {
    fileName,
  };
};

getFileUrl = async ({ keys }) => {
  const urls = await Promise.allSettled(
    keys.map((key) => {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
    })
  );

  return urls;
};

module.exports = {
  uploadFile,
  getFileUrl,
};
