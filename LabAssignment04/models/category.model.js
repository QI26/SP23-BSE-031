const mongoose = require("mongoose");

let categorySchema = mongoose.Schema({
    id: Number,
    title: String,
    description: String,
});

let CategoryModel = mongoose.model("Category" , categorySchema);

module.exports = CategoryModel;
