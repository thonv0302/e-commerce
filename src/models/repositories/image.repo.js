const imageModel = require('../image.model');
const { Types } = require('mongoose');

const queryImage = async ({
  query,
  limit = 5,
  sort = {
    _id: -1,
  },
  next_cursor = null,
  previous_cursor = null,
}) => {
  if (next_cursor) {
    query['_id'] = { $lt: new Types.ObjectId(next_cursor) };
  }

  if (previous_cursor) {
    query['_id'] = { $gt: new Types.ObjectId(previous_cursor) };
    sort = {
      _id: 1,
    };
  }

  const data = await imageModel.find(query).sort(sort).limit(limit);

  if (previous_cursor) data.reverse();

  let lastItemCursor, firstItemCursor;

  if (data.length) {
    const lastItemId = data[data.length - 1]._id;
    const firstItemId = data[0]._id;

    const queryNextItem = { _id: { $lt: new Types.ObjectId(lastItemId) } };
    const queryPrevItem = { _id: { $gt: new Types.ObjectId(firstItemId) } };

    const [result1, result2] = await Promise.all([
      imageModel
        .findOne({ ...query, ...queryNextItem })
        .sort(sort)
        .limit(limit),
      imageModel
        .findOne({ ...query, ...queryPrevItem })
        .sort(sort)
        .limit(limit),
    ]);

    if (result1) {
      lastItemCursor = lastItemId;
    }
    if (result2) {
      firstItemCursor = firstItemId;
    }
  }

  return {
    data,
    lastItemCursor,
    firstItemCursor,
  };
};

module.exports = {
  queryImage,
};
