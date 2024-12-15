const express = require("express");
let router = express.Router();
let Category = require("../../models/category.model");

router.get("/admin/categories/delete/:id" , async (req,res)=> {
    let params = req.params;
    let category  = await Category.findByIdAndDelete(req.params.id);
    return res.redirect("/admin/categories");
});

router.get("/admin/categories/edit/:id" , async (req,res) => {
    let category = await Category.findById(req.params.id);
    return res.render("admin/category-edit" , {
        layout : "adminlayout",
        category,
    })
});

router.post("/admin/categories/edit/:id" , async (req,res) =>{
    let category = await Category.findById(req.params.id);
    category.id = req.body.id;
    category.title = req.body.title;
    category.description = req.body.description;
    await category.save();
    return res.redirect("/admin/categories");
});

router.get("/admin/categories/create" , async(req,res) => {
    return res.render("admin/category-form" , {
        layout : "adminlayout"
    })
});

router.post("/admin/categories/create" , async(req,res) => {
    let data   = req.body;
    let newCategory = new Category(data);
    newCategory.title = data.title;
    await newCategory.save();
    return res.redirect("/admin/categories");

});

router.get("/admin/categories", async (req, res) => {
    let categories = await Category.find();
    return res.render("admin/categories", {
      layout: "adminlayout",
      pageTitle: "Manage Your Categories",
      categories,
    });

});
module.exports = router;