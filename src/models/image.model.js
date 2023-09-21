'use strict';

//!dmbg
const { model, Schema } = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Image';
const COLLECTION_NAME = 'Images';

// Declare the Schema of the Mongo model
var imageSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    image_shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    alt: {
      type: String,
      default: 'image',
    },
    url: {
      type: String,
      require: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: '',
    },
    belong: {
      type: String,
      enum: ['product', 'shop'],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, imageSchema);
