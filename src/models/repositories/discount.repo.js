'use strict';

const { get } = require('lodash');
const { getSelectData, unGetSelectData } = require('../../utils');

const findAllDiscountCodesUnSelected = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  filter,
  // unSelect,
  select,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    // .select(unGetSelectData(unSelect))
    .select(getSelectData(select))
    .lean();

  return documents;
};

const findAllDiscountCodesSelected = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  filter,
  select,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return documents;
};

const checkDiscountExists = async ({ model, filter }) => {
  return await model.findOne(filter).lean();
};

const updateDiscountById = async ({ discountId, bodyUpdate, model }) => {
  console.log({
    discountId,
    bodyUpdate,
    model,
  });
  return await model.findByIdAndUpdate(discountId, bodyUpdate);
};
module.exports = {
  findAllDiscountCodesUnSelected,
  findAllDiscountCodesSelected,
  checkDiscountExists,
  updateDiscountById,
};
