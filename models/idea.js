const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ideaSchema = new Schema({
    title: String,
    description: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // image: String
})

const Idea = mongoose.model('Idea', ideaSchema);
module.exports = Idea;

