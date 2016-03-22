'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    shortId = require('shortid');

var AssignmentSchema = new Schema({
  name: String,
  type: {
    type: String,
    default: 'Assignment'
  },
  pointsPossible: Number,
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  author: Schema.Types.ObjectId,
  subject: {},
  code: {
    type: String,
    unique: true,
    sparse: true,
    'default': shortId.generate
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
