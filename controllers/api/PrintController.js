const db = require('../../database/db');
const ejs = require('ejs');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');

const BaseUrl = process.env.BASEURL;
const PRINT_API_URL = process.env.PRINT_API_URL;
const PRINT_API_KEY = process.env.PRINT_API_KEY;


const updatePath = async(item)=>{
    return item.map(item => ({
        ...item,
        front_image: (item.front_image && item.front_image!="")? item.front_image.replace('/uploads', BaseUrl+'/uploads'):'',
        //cover_pdf: (item.cover_pdf && item.cover_pdf!="")? BaseUrl+'/pdfs'+item.cover_pdf:'',
        //innerpage_pdf: (item.innerpage_pdf && item.innerpage_pdf!="")? BaseUrl+'/pdfs'+item.innerpage_pdf:''
    }));
}

//const apiSendItemToPrint = async(CartID) =>{
exports.apiSendItemToPrint = async (req, res) => {
    const { CartID } = req.params;

    const Cart_SQL = "SELECT * FROM orders WHERE id=?";
    const Cart_Result = await db.query(Cart_SQL, [CartID]);

    const Items_SQL = "SELECT o.*, c.cover_pdf as cover_design_pdf FROM order_items o LEFT JOIN cover_items c ON o.cover_id=c.id WHERE o.order_id=?";
    const Items_Result = await db.query(Items_SQL, [CartID]);
  
    //const SKU = '8x8-softcover-uncoated';
    const SKU = '7.5x10_hc_printed';
    const FoilUrl = BaseUrl+'/assets/FOIL.pdf';
    
    const PhotoBookItems = [];
    Items_Result.forEach((item)=>{
        var CoverUrl = '';
        var GutUrl = BaseUrl+'/pdfs/'+item.innerpage_pdf.replace('Diary','Diary_Print');
        if(item.cover_id>0){
            CoverUrl = BaseUrl+item.cover_design_pdf;
        }else{
            CoverUrl = BaseUrl+'/pdfs/'+item.cover_pdf;
        }

        const  PhotoBook = {
            "itemKey": `${item.id}`,
            "description": "Diary",
            "sku": SKU,
            "quantity": item.quantity,
            "foilUrl": FoilUrl,
            "foilColor": "GOLD",
            "coverUrl": CoverUrl,
            "gutsUrl": GutUrl
          };
          
          PhotoBookItems.push(PhotoBook);
    });
    console.log("PhotoBook=>",PhotoBookItems);

    var shippingMethod = "FEDEXONERATEPAK";
    if(Cart_Result[0].shipping_country!="United States"){
         shippingMethod = "FEDEXINTLPRPAK";
    }

    //console.log(shippingMethod, Cart_Result[0].shipping_country)

    const postPrintData = {
        "orderKey1": `CART-${CartID}`,
        "photobookItems": PhotoBookItems,
        "shipping": {
          "shipMethod": shippingMethod,
          "address": {
            "name": Cart_Result[0].shipping_name,
            "address1": Cart_Result[0].shipping_houseno,
            "address2": Cart_Result[0].shipping_street,
            "city": Cart_Result[0].shipping_city,
            "state": Cart_Result[0].shipping_state,
            "postalCode": Cart_Result[0].shipping_zipcode,
            "countryCode": Cart_Result[0].shipping_country,
            "phoneNumber": Cart_Result[0].shipping_phone,
          }
        }
      }

      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
          'X-API-KEY': `${PRINT_API_KEY}`, // Add your Authorization header
        },
      };

      //console.log(postPrintData,axiosConfig);

    axios.post(`${PRINT_API_URL}/v1.1/order`,postPrintData, axiosConfig)
    .then(response => {
        console.log("Print Order=>",response)
        res.status(200).send({
            status: true,
            result: {message:"Print Order successful"},
            errors: "",
          });
      
    })
    .catch(error => {
        res.status(200).send({
            status: false,
            result: "",
            errors: "Print Order failed due to "+error.response.data.message,
            errorData: error,
        });
        console.error('Print Error:', error.response.data.message);
    });
}


exports.apiOrderPrintingStatus = async (req, res) => {

    const { orderKey1 } = req.params;
    const status_detail = JSON.stringify(req.body);
    const CartID = orderKey1.replace(`CART-`,'');

    const Cart_SQL = "SELECT * FROM orders WHERE id=?";
    const Cart_Result = await db.query(Cart_SQL, [CartID]);

   if(Cart_Result.length){
    const Print_SQL = 'SELECT * FROM order_printing_status WHERE order_id = ? AND status_type=?';
    const Print_Result = await db.query(Print_SQL, [CartID,'Printing']);
    if(Print_Result.length){
        const Update_SQL = 'UPDATE order_printing_status SET status_detail=? WHERE order_id = ? AND status_type=?';
        const Update_Result = await db.query(Update_SQL, [status_detail, CartID,'Printing']);

        res.status(200).send({
            description: "OK",
        }); 
    }else{
        const Insert_SQL = 'INSERT INTO order_printing_status SET order_id = ?, status_type=?, status_detail=?';
        const Insert_Result = await db.query(Insert_SQL, [CartID,'Printing', status_detail]);

        res.status(200).send({
            description: "OK",
        }); 
    }

   }else{
        res.status(200).send({
            error: "orderKey1 is not exists"
        }); 
   }

}

exports.apiOrderShippingStatus = async (req, res) => {
    const { orderKey1 } = req.params;
    const status_detail = JSON.stringify(req.body);
    const CartID = orderKey1.replace(`CART-`,'');

    const Cart_SQL = "SELECT * FROM orders WHERE id=?";
    const Cart_Result = await db.query(Cart_SQL, [CartID]);

   if(Cart_Result.length){
    const Print_SQL = 'SELECT * FROM order_printing_status WHERE order_id = ? AND status_type=?';
    const Print_Result = await db.query(Print_SQL, [CartID,'Shipping']);
    if(Print_Result.length){
        const Update_SQL = 'UPDATE order_printing_status SET status_detail=? WHERE order_id = ? AND status_type=?';
        const Update_Result = await db.query(Update_SQL, [status_detail, CartID,'Shipping']);

        res.status(200).send({
            description: "OK",
        }); 
    }else{
        const Insert_SQL = 'INSERT INTO order_printing_status SET order_id = ?, status_type=?, status_detail=?';
        const Insert_Result = await db.query(Insert_SQL, [CartID,'Shipping', status_detail]);

        res.status(200).send({
            description: "OK",
        }); 
    }

   }else{
        res.status(200).send({
            error: "orderKey1 is not exists"
        }); 
   }
}

exports.apiOrderPrintError = async (req, res) => {
    const { orderKey1 } = req.params;
    const status_detail = JSON.stringify(req.body);
    const CartID = orderKey1.replace(`CART-`,'');

    const Cart_SQL = "SELECT * FROM orders WHERE id=?";
    const Cart_Result = await db.query(Cart_SQL, [CartID]);

   if(Cart_Result.length){
    const Print_SQL = 'SELECT * FROM order_printing_status WHERE order_id = ? AND status_type=?';
    const Print_Result = await db.query(Print_SQL, [CartID,'Error']);

    if(Print_Result.length){
        const Update_SQL = 'UPDATE order_printing_status SET status_detail=? WHERE order_id = ? AND status_type=?';
        const Update_Result = await db.query(Update_SQL, [status_detail, CartID,'Error']);

        res.status(200).send({
            description: "OK",
        }); 
    }else{
        const Insert_SQL = 'INSERT INTO order_printing_status SET order_id = ?, status_type=?, status_detail=?';
        const Insert_Result = await db.query(Insert_SQL, [CartID,'Error', status_detail]);

        res.status(200).send({
            description: "OK",
        }); 
    }

   }else{
        res.status(200).send({
            error: "orderKey1 is not exists"
        }); 
   }
}

