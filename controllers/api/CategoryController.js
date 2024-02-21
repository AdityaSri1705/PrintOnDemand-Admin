const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;


exports.apiAllCategories = async (req, res) => {

 
    try {
      const sqlCount = 'SELECT COUNT(*) AS totalCategories FROM `categories`';
      const [countRows] = await db.query(sqlCount);
      const totalCategories = countRows.totalCategories;

      //check the email id  is exists in Categories table or not
      const sql = 'SELECT * FROM `categories`';
      var categories = await db.query(sql);

      categories = categories.map(cat => ({
        ...cat,
        image: cat.image.replace('/uploads', baseUrl+'/uploads')
      }));
    
      res.status(200).send({ 
        status: true, 
        result: { 
          totalCategories: totalCategories,
          categories: categories,
         }, 
        errors: "" 
      });
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };