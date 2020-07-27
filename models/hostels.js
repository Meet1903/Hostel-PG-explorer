const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var commentSchema = new Schema({
    rating:  {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment:  {
        type: String,
        required: true
    },
    author:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const hostelSchema = new Schema({
    name :{
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true
    },
    location:{
        type: String
    },
    fees:{
        type: String
    },
    comments: [commentSchema]
},{
        timestamps: true

});

var hostels =mongoose.model('hostel', hostelSchema);

module.exports = hostels;