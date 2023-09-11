'use strinct';

const _ = require('lodash');
const { Types } = require('mongoose');

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]));
};

const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] == null) {
      delete obj[k];
    }
  });

  return obj;
};

const updateNestedObjectParser = (obj) => {
  const final = {};
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      const response = updateNestedObjectParser(obj[k]);
      Object.keys(response).forEach((a) => {
        final[`${k}.${a}`] = response[a];
      });
    } else {
      final[k] = obj[k];
    }
  });

  return final;
};

function removeFalsyValues(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(removeFalsyValues)
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          (typeof value !== 'object' || Object.keys(value).length > 0)
      );
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const cleanedValue = removeFalsyValues(value);
    if (
      cleanedValue !== null &&
      cleanedValue !== undefined &&
      (typeof cleanedValue !== 'object' ||
        Object.keys(cleanedValue).length > 0) &&
      !Number.isNaN(cleanedValue)
    ) {
      acc[key] = cleanedValue;
    }
    return acc;
  }, {});
}

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestedObjectParser,
  convertToObjectIdMongodb,
  removeFalsyValues,
};
