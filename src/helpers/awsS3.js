const {
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
  signatureVersion,
} = require('../configs/config.aws');
const crypto = require('crypto');

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  signatureVersion,
});

getFileUrl = async ({ keys }) => {
  const urls = await Promise.allSettled(
    keys.map((key) => {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Expires: 315360000,
      });

      return getSignedUrl(s3Client, command);
    })
  );

  return urls;
};

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

  const urls = await getFileUrl({
    keys: [fileName]
  })

  return urls[0].value
};

const uploadFiles = async (files) => {
  const fileNames = []
  await Promise.allSettled(files.map(file => {
    const fileName = generateFileName(file.originalname);
    fileNames.push(fileName);
    const uploadParams = {
      Bucket: bucket,
      Body: file.buffer,
      Key: fileName,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);

    return s3Client.send(command);
  }))

  const urls = await getFileUrl({
    keys: fileNames
  })

  return urls.map(url => url.value)
}



module.exports = {
  uploadFile,
  uploadFiles,
  getFileUrl,
};
