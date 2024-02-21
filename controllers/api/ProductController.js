const db = require('../../database/db');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

/*------------------ Supportive functions ---------------------------*/

const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = await degToRad(lat1);
  const lon1Rad = await degToRad(lon1);
  const lat2Rad = await degToRad(lat2);
  const lon2Rad = await degToRad(lon2);

  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
}

const degToRad = async (degrees) => {
  return degrees * (Math.PI / 180);
}

const getUserDetails = async (user_id) => {
  // Simulate fetching user details asynchronously
  const user_sql = `SELECT id, first_name, last_name, profile_img, gender FROM users WHERE id=?`;
  const [user] = await db.query(user_sql, [user_id]);

    return { 
      id: user.id,
      name: user.first_name+" "+user.last_name,
      profile_image: baseUrl+user.profile_img,
      gender: user.gender
    }; // Replace with actual async operation
};

const getExtraImages = async (prod_id) => {
  // Simulate fetching product images asynchronously
  const img_sql = "SELECT * FROM `product_images` WHERE prod_id=?";
  var prod_images = await db.query(img_sql, [prod_id]);

    prod_images = await updateImagesPath(prod_images);

    return prod_images; // Replace with actual async operation
};


const getCategories = async (cat_ids) => {
  // Simulate fetching product images asynchronously
  const cat_sql = "SELECT id, title, image FROM `categories` WHERE id IN ("+cat_ids+")";
  var prod_cats = await db.query(cat_sql);
  prod_cats = prod_cats.map(cat => ({
    ...cat,
    image: cat.image.replace('/uploads', baseUrl+'/uploads')
  }));
    return prod_cats; // Replace with actual async operation
};

const updateImagesPath = async(products)=>{
   return products.map(prod => ({
    ...prod,
    prod_image: prod.prod_image.replace('/uploads', baseUrl+'/uploads')
  }));
}

/* ------------ API ---------------------------*/


exports.apiAllProducts = async (req, res) => {

  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const user_id = req.user.userId; 
  const sortby = req.body.sortby;
  const page = req.body.page || 1;
  const perPage = (req.body.perPage || 20)*1;
  const offset = (page-1)*perPage;
 
  var cons = "";
 


  if(req.body.state){
    cons += " AND prod_condition='"+req.body.state+"'";
  }
  if(req.body.color){
    cons += " AND prod_color='"+req.body.color+"'";
  }
  if(req.body.distance){
    const lat1 = req.body.latitude;
    const lon1 = req.body.longitude;
    const distance = req.body.distance;
    var userids= [];

    const user_sql= "SELECT id, latitude, longitude FROM `users` WHERE id!=? AND status='1'";
    const users = await db.query(user_sql,[user_id]);
    users.forEach(async (row)=>{
        var user_distance = await calculateDistance(lat1, lon1, row.latitude, row.longitude);
        if(user_distance < distance){
          userids.push(row.id)
        }
    });
    if(userids.length>0){
      cons += " AND user_id IN("+userids.join(',')+")";
    }
     
  }
  if(req.body.cat_ids){
    cat_ids = req.body.cat_ids.split(',');
    var con1 = [], con2 = [];
    cat_ids.forEach((id)=>{
      con1.push('cat_id = '+id);
      con2.push('FIND_IN_SET('+id+', cat_id) > 0');
    });

    cons += ' AND (('+con1.join(' OR ') +') OR ('+con2.join(' OR ')+'))';
  }

 
  try {

    const filtered_sql = "SELECT id FROM `products` WHERE user_id!=?  AND status='1' "+cons;
    const filtered_prods = await db.query(filtered_sql, [user_id]);

    const liked_sql = "SELECT itemB as id FROM `matching_likes` WHERE userA=?";
    const liked_prodids = await db.query(liked_sql, [user_id]);
    console.log(filtered_prods, liked_prodids);
    var prods = []
    if(sortby=="nearby"){
      prods = filtered_prods.concat(liked_prodids);
    }else{
      prods = liked_prodids.concat(filtered_prods);
    }
    const prodIds = prods.map(prod => prod.id).join(",");

    const sqlCount = "SELECT COUNT(*) AS totalProducts FROM `products` WHERE user_id!=? AND status='1' AND id IN ("+prodIds+")";
    const [countRows] = await db.query(sqlCount,[user_id]);
    const totalProducts = countRows.totalProducts;

    //check the email id  is exists in Products table or not
    const sql = "SELECT * FROM `products` WHERE user_id!=?  AND status='1' AND id IN ("+prodIds+") LIMIT ? OFFSET ?";
    var products = await db.query(sql, [user_id, perPage, offset]);
    products = await updateImagesPath(products);

    
    var productsWithUserDetails = [];
    const processProducts = async () => {
      const promises = products.map(async product => {
        const userDetails = await getUserDetails(product.user_id);
        const prod_images = await getExtraImages(product.id);
        const prod_cats = await getCategories(product.cat_id);
        return { ...product, user: userDetails, other_images: prod_images, category:prod_cats  };
      });
    
      const productsWithUserDetails = await Promise.all(promises);
        res.status(200).send({ 
          status: true, 
          result: { 
            totalProducts: totalProducts,
            products: productsWithUserDetails,
            baseUrl: baseUrl,
            paginationUrl:"products",
            currentPage: page,
            totalPages: Math.ceil(totalProducts/ perPage),
          }, 
          errors: "" 
        });
    };
    
    processProducts().catch(error => {
      res.status(400).send({ status: false, result: "", errors:error });
    });
    

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:error });
  }
 
};





exports.apiMyProducts = async (req, res) => {

  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const user_id = req.user.userId; 
  const sortby = req.body.sortby;

  const page = req.body.page || 1;
  const perPage = (req.body.perPage || 15)*1;
  const offset = (page-1)*perPage;

  var cons = "";
  if(req.body.state){
    cons += " AND prod_condition='"+req.body.state+"'";
  }

  
  if(req.body.search){
    cons += " AND (prod_title LIKE '%"+req.body.search+"%')";
  }

  var orderby = " ORDER BY rand()";
  if(req.body.sortby){
    if(sortby=="A-Z")
      orderby = " ORDER BY prod_title ASC";
    else if(sortby=="Z-A")
      orderby = " ORDER BY prod_title DESC";
    else
      orderby = " ORDER BY rand()";
  }
 
  try {
    const sqlCount = `SELECT COUNT(*) AS totalProducts FROM products WHERE user_id=? ${cons}`;
    const [countRows] = await db.query(sqlCount,[user_id]);
    const totalProducts = countRows.totalProducts;

    //check the email id  is exists in Products table or not
    const sql = `SELECT * FROM products WHERE user_id=? ${cons} ${orderby} LIMIT ? OFFSET ?`;
    var products = await db.query(sql, [user_id, perPage, offset]);
    products = products.map(product => ({
      ...product,
      prod_image: product.prod_image.replace('/uploads', baseUrl+'/uploads')
    }));

    var productsWithUserDetails = [];
    const processProducts = async () => {
      const promises = products.map(async product => {
        const userDetails = await getUserDetails(product.user_id);
        const prod_images = await getExtraImages(product.id);
        const prod_cats = await getCategories(product.cat_id);
        return { ...product, user: userDetails, other_images: prod_images, category:prod_cats  };
      });
    
      const productsWithUserDetails = await Promise.all(promises);
        res.status(200).send({ 
          status: true, 
          result: { 
            totalProducts: totalProducts,
            products: productsWithUserDetails,
            baseUrl: baseUrl,
            paginationUrl:"products",
            currentPage: page,
            totalPages: Math.ceil(totalProducts/ perPage),
          }, 
          errors: "" 
        });
    };
    
    processProducts().catch(error => {
       res.status(400).send({ status: false, result: "", errors:"Error: "+error });
    });



  } catch (error) { 
    res.status(500).send({ status: false, result: "", errors:"Error: "+error });
  }
 
};

exports.apiUserProducts = async (req, res) => {

  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  const user_id = req.body.user_id; 
  const sortby = req.body.sortby;

  const page = req.body.page || 1;
  const perPage = (req.body.perPage || 15)*1;
  const offset = (page-1)*perPage;

  var cons = "";
  if(req.body.state){
    cons += " AND prod_condition='"+req.body.state+"'";
  }


  var orderby = " ORDER BY rand()";
  if(req.body.sortby){
    if(sortby=="A-Z")
      orderby = " ORDER BY prod_title ASC";
    else if(sortby=="Z-A")
      orderby = " ORDER BY prod_title DESC";
    else
      orderby = " ORDER BY rand()";
  }
 
  try {
    const sqlCount = `SELECT COUNT(*) AS totalProducts FROM products WHERE status='1' AND user_id=? ${cons}`;
    const [countRows] = await db.query(sqlCount,[user_id]);
    const totalProducts = countRows.totalProducts;

    
    //check the email id  is exists in Products table or not
    const sql = `SELECT * FROM products WHERE status='1' AND user_id=? ${cons} ${orderby} LIMIT ? OFFSET ?`;
    var products = await db.query(sql, [user_id, perPage, offset]);
    //products = products.map(item => item.replace());
    // Create a new product list with updated image URLs
     products = products.map(product => ({
      ...product,
      prod_image: product.prod_image.replace('/uploads', baseUrl+'/uploads')
    }));
   
    var productsWithUserDetails = [];
    const processProducts = async () => {
      const promises = products.map(async product => {
        const userDetails = await getUserDetails(product.user_id);
        const prod_images = await getExtraImages(product.id);
        const prod_cats = await getCategories(product.cat_id);
        
        return { ...product, user: userDetails, other_images: prod_images, category:prod_cats  };
      });
    
      const productsWithUserDetails = await Promise.all(promises);
        res.status(200).send({ 
          status: true, 
          result: { 
            totalProducts: totalProducts,
            products: productsWithUserDetails,
            baseUrl: baseUrl,
            paginationUrl:"products",
            currentPage: page,
            totalPages: Math.ceil(totalProducts/ perPage),
          }, 
          errors: "" 
        });
    };
    
    processProducts().catch(error => {
       res.status(400).send({ status: false, result: "", errors:"Error: "+error });
    });



  } catch (error) { 
    res.status(500).send({ status: false, result: "", errors:"Error: "+error });
  }
 
};

exports.apiCreateProduct = async (req, res) => {
  
  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  // Handle multer error specifically for incorrect image type
  if (req.fileValidationError) {
    return res.status(400).send({status: false, result: "", errors: req.fileValidationError.message });
  }

  const { user_id, cat_id, prod_title, prod_model, prod_year, prod_condition, prod_color, prod_size, prod_description, prod_value } = req.body;
  const prod_status = '1';

  var product_image = "";
  if(req.files.product_image){
     product_image = '/uploads/products/' + req.files.product_image[0].filename;
  }

  
  
  try {
    //check the email id  is exists in product table or not
    const sql = "SELECT * FROM `products` WHERE user_id=? AND prod_title=?";
    const product = await db.query(sql, [user_id, prod_title]);
    if(product.length === 0)
    {
      // insert data from the product table
      const sql = "INSERT INTO `products` SET user_id=?, cat_id=?, prod_title=?, prod_model=?, prod_year=?, prod_condition=?, prod_color=?, prod_size=?, prod_description=?, prod_value=?, prod_image=?, status=?";
      const results = await db.query(sql, [user_id, cat_id, prod_title, prod_model, prod_year, prod_condition, prod_color, prod_size, prod_description, prod_value, product_image, prod_status]);

      //adding addition images in product_images table
      if(req.files.product_otherimages && req.files.product_otherimages.length>0){
        otherimages = req.files.product_otherimages;
        otherimages.forEach((img)=>{
            var pimage = '/uploads/products/' + img.filename;
            const imgsql = "INSERT INTO `product_images` SET prod_id=?, prod_image=?";
            const img_results =  db.query(imgsql, [results.insertId,pimage]);
        });         
    }

    
    const prod_sql = "SELECT * FROM `products` WHERE id=?";
    var new_product = await db.query(prod_sql, [results.insertId]);
    new_product = await updateImagesPath(new_product);

      if (results.insertId > 0) {
          res.status(200).send({ 
            status: true, 
            result: { 
              insertId: results.insertId,
              product: new_product,
              message: "Product has been submitted for admin approval "
            }, 
            errors: "" 
          });
          
      } else {
        res.status(500).send({ status: false, result: "", errors:'Error creating data:'+error });
      }
    }else{
        res.status(500).send({ status: false, result: "", errors:"Sorry. This title is already exists!" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error creating product:'+error });
  }

  
};

exports.apiGetProduct = async (req, res) => {

  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

    var product_id = req.params.id;
  
  try {
    //check the email id  is exists in product table or not
    const sql = 'SELECT * FROM `products` WHERE id = ?';
    var product = await db.query(sql, [product_id]);
    product = await updateImagesPath(product);

    
    
    if(product.length > 0)
    {

    
        const processProducts = async () => {
          const promises = product.map(async prod => {
            const userDetails = await getUserDetails(prod.user_id);
            const prod_images = await getExtraImages(prod.id);
            const prod_cats = await getCategories(prod.cat_id);
            
            return { ...prod, user: userDetails, other_images: prod_images, category:prod_cats  };
          });
        
          const productWithUserDetail = await Promise.all(promises);
              res.status(200).send({ 
                status: true, 
                result: { 
                  product: productWithUserDetail[0],
                }, 
                errors: "" 
              });
          };
          
          processProducts().catch(error => {
            res.status(400).send({ status: false, result: "", errors:"Error: "+error });
          });


        }else{
            res.status(500).send({ status: false, result: "", errors:"Sorry. No product records exists!" });
        }

    } catch (error) {
      res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
    }


};

exports.apiUpdateProduct = async (req, res) => {

  //validate request
  if (!req.body) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }

  // Handle multer error specifically for incorrect image type
  if (req.fileValidationError) {
    return res.status(400).send({status: false, result: "", errors: req.fileValidationError.message });
  }

  const { id, user_id, cat_id, prod_title, prod_model, prod_year, prod_condition, prod_color, prod_size, prod_description, prod_value } = req.body;

  try {
    //check the email id  is exists in product table or not
    const sql = 'SELECT * FROM `products` WHERE id=?';
    const product = await db.query(sql, [id]);
    
    if(product.length > 0)
    {

      var product_image = product[0].prod_image;
      if(req.files.product_image){
        // Delete the old product image
        if (product_image) {
          const oldProductImagePath = path.join(__dirname, '../../public/', product_image);
          await fs.access(oldProductImagePath); // Check if the file exists
          await fs.unlink(oldProductImagePath);
        }
        product_image = '/uploads/products/' + req.files.product_image[0].filename;
      }

      

      // Update data into the product table
      const sql = "UPDATE `products` SET user_id=?, cat_id=?, prod_title=?, prod_model=?, prod_year=?, prod_condition=?, prod_color=?, prod_size=?, prod_description=?, prod_value=?, prod_image=? WHERE id=?";
      const edit_results = await db.query(sql, [user_id, cat_id, prod_title, prod_model, prod_year, prod_condition, prod_color, prod_size, prod_description, prod_value, product_image, id]);
     
      //adding addition images in product_images table
      if(req.files.product_otherimages && req.files.product_otherimages.length>0){
          otherimages = req.files.product_otherimages;
          otherimages.forEach((img)=>{
              var pimage = '/uploads/products/' + img.filename;
              const imgsql = "INSERT INTO `product_images` SET prod_id=?, prod_image=?";
              const img_results =  db.query(imgsql, [id,pimage]);
          });         
      }

      if (edit_results.affectedRows > 0) {

          const updated_sql = 'SELECT * FROM `products` WHERE id=?';
          var product2 = await db.query(updated_sql, [id]);
          product2 = await updateImagesPath(product2);

          res.status(200).send({ 
            status: true, 
            result: { 
              product: product2[0],
              message: "Product has been updated successfully"
            }, 
            errors: "" 
          });
      } else {
        res.status(500).send({ status: false, result: "", errors:"Product record has not updated." });
      }
    }else{
      res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot updated with id "+id+". Maybe id is wrong" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }
};

exports.apiDeleteProduct = async (req, res) => {

  //validate request
  if (!req.params) {
    res.status(400).send({
      status: false,
      result: "",
      errors: "Request parameters can not be empty!",
    });
  }
  const id = req.body.id;
  const user_id = req.body.user_id;

  try {
    //check the email id  is exists in product table or not
    const sql = 'SELECT * FROM `products` WHERE id=? AND user_id=?';
    const product = await db.query(sql, [id, user_id]);
    if(product.length > 0)
    {
      var product_image = product[0].prod_image;

      // Delete the old product image
      if (product_image) {
        const oldProductImagePath = path.join(__dirname, '../../public/', product_image);
        try {
          await fs.access(oldProductImagePath); // Check if the file exists
          await fs.unlink(oldProductImagePath); // Delete the file
        } catch (err) {
          res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+err });
        }
      }

      // Delete data from the product table
      const sql = 'DELETE FROM `products` WHERE id=?';
      const edit_results = await db.query(sql, [id]);
     
      if (edit_results.affectedRows > 0) {
        res.status(200).send({ 
          status: true, 
          result: { 
            message: "Product has been deleted succesfully."
          }, 
          errors: "" 
        });
      }else{
        res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot Delete with id "+id+"." });
      }

    }else{
      res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot Delete with id "+id+". Maybe id is wrong" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }
  
}

exports.apiStatusProduct = async (req, res) => {
  const id = req.body.id;
  const status = req.body.status || 0;

  try {
    //check the email id  is exists in product table or not
    const sql = 'SELECT * FROM `products` WHERE id = ?';
    const product = await db.query(sql, [id]);
    if(product.length > 0)
    {
      
      // update status in the product table
      const sql = "UPDATE `products` SET status=?  WHERE id=?";
      const status_results = await db.query(sql, [status, id]);
  
      if (status_results.affectedRows > 0) {
        res.status(200).send({ 
          status: true, 
          result: { 
            message: "Product status has been updated succesfully"
          }, 
          errors: "" 
        });
      }else{
        res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot update status with id "+id+"." });
      }

    }else{
      res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot update status with id "+id+". Maybe id is wrong" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }
  
}

exports.apiColors = async (req, res) => {
  try {
    
    const color_sql = 'SELECT color_name, color_code FROM `colors`';
    const colors = await db.query(color_sql);
    if(colors.length > 0)
    {
      
      res.status(200).send({ 
        status: true, 
        result: { 
           colors: colors
        }, 
        errors: "" 
      });
    }else{
      res.status(500).send({ status: false, result: "", errors:"Sorry. Cannot update status with id "+id+". Maybe id is wrong" });
    }

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }
}


exports.apiYears = async (req, res) => {
  try {
    var yearList = [];
    const startYear = 1970;
    const currentYear = new Date().getFullYear(); 

    for(let year = startYear; year <= currentYear; year++){
      yearList.push(year);
    }
    res.status(200).send({ 
      status: true, 
      result: { 
        years: yearList
      }, 
      errors: "" 
    });

  } catch (error) {
    res.status(500).send({ status: false, result: "", errors:'Error fetching data:'+error });
  }
}
