'use strict';

const mongoose = require('mongoose');

const connectString = `mongodb+srv://thonv0302:chemgio123@trainning.55stg.mongodb.net/shop`;
console.log('vao day');
mongoose
  .connect(connectString)
  .then((_) => console.log(`Connected Mongodb Success`))
  .catch((err) => console.log(`Error Connect!`));

if (1 === 0) {
  mongoose.set('debug', true);
  mongoose.set('debug', { color: true });
}

module.exports = mongoose;
