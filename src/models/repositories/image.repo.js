const imageModel = require('../image.model')
const { Types } = require('mongoose');

const queryImage = async ({
  query,
  limit = 1,
  sort = {
    _id: -1
  },
  next_cursor = null,
  previous_cursor = null,
}) => {
  if (next_cursor) {
    query['_id'] = { $lt: new Types.ObjectId(next_cursor) }
  }

  if (previous_cursor) {
    query['_id'] = { $gt: new Types.ObjectId(previous_cursor) }
  }


  const data = await imageModel.find(query).sort(sort).limit(limit)

  let lastItemCursor, firstItemCursor;

  if (data.length) {
    const lastItemId = data[data.length - 1]._id;
    const firstItemId = data[0]._id;

    const queryNextItem = { _id: { $lt: lastItemId } };
    const queryPrevItem = { _id: { $gt: firstItemId } }
    const data1 = await Promise.all([imageModel.findOne(queryNextItem), imageModel.findOne(queryPrevItem)]);

    console.log('data1: ', data1);

    // if (result1) {
    //   lastItemCursor = lastItemId
    // }
    // if (result2) {
    //   firstItemCursor = firstItemId
    // }

  }

  return {
    data,
    lastItemCursor,
    firstItemCursor
  }
};

module.exports = {
  queryImage,
};
