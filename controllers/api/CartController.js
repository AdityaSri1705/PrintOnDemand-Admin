const db = require('../../database/db');
const ejs = require('ejs');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');

const BaseUrl = process.env.BASEURL;
const PRINT_API_URL = process.env.PRINT_API_URL;
const PRINT_API_KEY = process.env.PRINT_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(STRIPE_SECRET_KEY);

const updatePath = async(item)=>{
    return item.map(item => ({
        ...item,
        front_image: (item.front_image && item.front_image!="")? item.front_image.replace('/uploads', BaseUrl+'/uploads'):'',
        //cover_pdf: (item.cover_pdf && item.cover_pdf!="")? BaseUrl+'/pdfs'+item.cover_pdf:'',
        //innerpage_pdf: (item.innerpage_pdf && item.innerpage_pdf!="")? BaseUrl+'/pdfs'+item.innerpage_pdf:''
    }));
}

exports.apiSavePregress = async (req, res) => {
    const postData = req.body;
    //validate request
    if (!req.body) {
        res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
        });
    }
    

    const user_id = req.user.userId;
    try {
        const insert_sql = `INSERT INTO user_savedata SET user_id=?, diarydata=?`;
        const result = await db.query(insert_sql, [user_id, JSON.stringify(postData)]);

        res.status(200).send({
            status: true,
            result: result,
            message: "Diary Data has been saved successfully",
            errors: "",
        });

    } catch (error) {
        res.status(500).send({
        status: false,
        result: "",
        errors: " Error: " + error,
        errorData: error,
        });
    }
};

exports.apiAddCart = async (req, res) => {
    var {CartID, CoverPdfName, InnerPdfName, PriceData, DiaryData} = req.body;
    //validate request
    if (!req.body) {
        res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
        });
    }

    const user_id = req.user.userId;
    try {
        if(CartID!=""){
            const SQL = `SELECT * FROM orders WHERE user_id=? AND id=?`;
            const result = await db.query(SQL, [user_id, CartID]);
            if(result.length===0){
                //if CartID is not null but CartID is exists into order table then generate new CartID
                const Code = generateRandomCode(8);
                const insert_sql = `INSERT INTO orders SET user_id=?, code=?`;
                const insert_result = await db.query(insert_sql, [user_id, Code]);

                if (insert_result.insertId > 0) {
                    CartID = insert_result.insertId;
                }
            }
        }else{
            //if CartID is null then generate new CartID
            const Code = generateRandomCode(8);
            const insert_sql2 = `INSERT INTO orders SET user_id=?, code=?`;
            const insert_result2 = await db.query(insert_sql2, [user_id, Code]);

            if (insert_result2.insertId > 0) {
                CartID = insert_result2.insertId;
            }else{
                res.status(200).send({
                    status: false,
                    result: "",
                    errors: "Sorry! unable to generate Cart ID"
                });
            }
        }
        

        var CoverId = 0;
        if(DiaryData.Cover.CoverType=="predesign"){
            CoverId = DiaryData.Cover.CoverId;
        }

        const Diary_Data = JSON.stringify(DiaryData);
        const insertItem_sql = `INSERT INTO order_items SET order_id=?, cover_id=?, quantity=?, pagecount=?, price=?, maxdate=?, cover_pdf=?, innerpage_pdf=?, order_data=?`;
        const insertItem_result = await db.query(insertItem_sql, [CartID, CoverId, 1, PriceData.pageCount, PriceData.price, PriceData.maxDate, CoverPdfName, InnerPdfName, Diary_Data]);
        if (insertItem_result.insertId > 0) {

            //calculating cart total and update into order table
            await calulateCartPrice(CartID);

            res.status(200).send({
                status: true,
                result: { CartID: CartID },
                message: "Item has beed added into cart",
                errors: "",
            });
        }else{
            res.status(200).send({
                status: false,
                result: { CartID: CartID },
                message: "Sorry unable to add item into cart",
                errors: "",
            });
        }     

    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }
};

exports.apiGetCart = async (req, res) => {
    const { cartId } = req.params;
    const user_id = req.user.userId;
   
    try{
        const SQL = "SELECT * FROM orders WHERE id=? AND user_id=?";
        const CartResult = await db.query(SQL, [cartId, user_id]);
        var ItemsResult = [];
        if(CartResult.length>0){
            const item_SQL = "SELECT o.*, c.title, c.front_image FROM order_items o LEFT JOIN cover_items c ON o.cover_id=c.id WHERE o.order_id=?";
            ItemsResult = await db.query(item_SQL, [cartId]);
            ItemsResult = await updatePath(ItemsResult);    
        }
        res.status(200).send({
            status: true,
            result: {
                Cart: CartResult[0],
                CartItems: ItemsResult
            },
            errors: ""
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }
    
}

exports.apiUpdateCart = async (req, res) => {
    var { CartID, ItemsQty } = req.body;
    const user_id = req.user.userId;
   
    try{
        const SQL = "SELECT * FROM orders WHERE id=? AND user_id=?";
        const CartResult = await db.query(SQL, [CartID, user_id]);

        var ItemsResult = [];
        if(CartResult.length>0){
            ItemsQty = JSON.parse(ItemsQty);

            ItemsQty.forEach(async(item)=>{
                if(item.quantity>0){
                    const item_SQL = "UPDATE order_items SET quantity=? WHERE order_id=? AND id=?";
                    const Item_Result = await db.query(item_SQL, [item.quantity, CartID, item.id]);
                }
            });

            //calculating cart total and update into order table
            await calulateCartPrice(CartID);

            const item_SQL = "SELECT o.*, c.title, c.front_image FROM order_items o LEFT JOIN cover_items c ON o.cover_id=c.id WHERE o.order_id=?";
            ItemsResult = await db.query(item_SQL, [CartID]);
            ItemsResult = await updatePath(ItemsResult); 
        }
        res.status(200).send({
            status: true,
            result: {
                message: "Cart items has been updated.",
                Cart: CartResult[0],
                CartItems: ItemsResult
            },
            errors: ""
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }  
}
exports.apiDeleteCartItem = async (req, res) => {
    var { CartID, ItemId } = req.body;
    const user_id = req.user.userId;

    try{
        const SQL = "SELECT * FROM orders WHERE id=? AND user_id=?";
        const CartResult = await db.query(SQL, [CartID, user_id]);

        var ItemsResult = [];
        if(CartResult.length>0){
            const delete_SQL = "DELETE FROM order_items WHERE order_id=? AND id=?";
            const delete_Result = await db.query(delete_SQL, [CartID, ItemId]);
            if (delete_Result.affectedRows > 0) {

                const item_SQL = "SELECT o.*, c.title, c.front_image FROM order_items o LEFT JOIN cover_items c ON o.cover_id=c.id WHERE o.order_id=?";
                ItemsResult = await db.query(item_SQL, [CartID]);
                ItemsResult = await updatePath(ItemsResult); 

                //calculating cart total and update into order table
                await calulateCartPrice(CartID);

                res.status(200).send({
                    status: true,
                    result: {
                        message: "Cart item has been deleted.",
                        Cart: CartResult[0],
                        CartItems: ItemsResult
                    },
                    errors: ""
                });
            }else{
                res.status(200).send({
                    status: true,
                    result: {
                        message: "Sorry! unable to delete this item",
                        Cart: CartResult[0],
                        CartItems: ItemsResult
                    },
                    errors: ""
                });
            }
        }
        
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }  
}

exports.apiUpdateShippingInfo = async (req, res) => {
    const { CartID, shipping_name, shipping_email, shipping_phone, shipping_houseno, shipping_street, shipping_city, shipping_zipcode, shipping_state, shipping_country, subtotal, coupon, discount_amount, tax, shipping_cost, total } = req.body;
    const user_id = req.user.userId;

    try{
        const SQL = "SELECT * FROM orders WHERE id=? AND user_id=?";
        const CartResult = await db.query(SQL, [CartID, user_id]);

        if(CartResult.length>0){
            const update_SQL = "UPDATE orders SET shipping_name=?, shipping_email=?, shipping_phone=?, shipping_houseno=?, shipping_street=?, shipping_city=?, shipping_zipcode=?, shipping_state=?, shipping_country=?, subtotal=?, coupon=?, discount_amount=?, tax=?, shipping_cost=?, total=? WHERE id=?";
            const update_Result = await db.query(update_SQL, [shipping_name, shipping_email, shipping_phone, shipping_houseno, shipping_street, shipping_city, shipping_zipcode, shipping_state, shipping_country, subtotal, coupon, discount_amount, tax, shipping_cost, total, CartID ]);
            //calculating cart total and update into order table
            await calulateCartPrice(CartID);

            const SQL2 = "SELECT * FROM orders WHERE id=?";
            const CartResult2 = await db.query(SQL2, [CartID]);
   
            res.status(200).send({
                status: true,
                result: {
                    message: "Shipping information has been saved.",
                    Cart: CartResult2[0],
                },
                errors: ""
            }); 
        }
        
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }  
}

exports.apiStripePayment = async (req, res) => {
  const CartID = req.body.CartID; // Assuming you're sending the token in the request body\
  const token = req.body.token;
  const user_id = req.user.userId;
 
  const SQL = "SELECT * FROM orders WHERE id=? AND user_id=?";
  const CartResult = await db.query(SQL, [CartID, user_id]);
 
  if(CartResult.length>0){

    const chargeDesc = `Cart - ${CartResult[0].id}`;
    const chargeAmount = parseInt(CartResult[0].total*100);
    const currency = 'USD';
    
    console.log(CartID, user_id, chargeAmount, currency,  chargeDesc, token)
    try {
        const charge = await stripe.charges.create({
          amount: chargeAmount,
          currency: currency,
          source: token.id,
          description: chargeDesc,
        });
        
        //current date and time
        const transDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        const payment_response = JSON.stringify(charge);
        //console.log("charge=>",charge);
        const AmountCaptured = charge.amount_captured/100;
        const PayStatus = charge.paid? 'Success':'Failed';
        const trans_SQL = "INSERT INTO `payment_log` SET order_id=?, user_id=?, payment_type=?, amount=?, payment_status=?, transaction_id=?, payment_response=?, created_at=?"
        const trans_Result = await db.query(trans_SQL, [CartResult[0].id, user_id, 'Stripe', AmountCaptured, PayStatus, charge.id, payment_response, transDate ]);

        if (charge.paid) {
          const date =  new Date(charge.created * 1000);
          const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
          };
          //const chargeDate = date.toISOString().slice(0, 19).replace("T", " ");

          const update_SQL = "UPDATE orders SET payment_type=?, payment_id=?, payment_date=?, payment_status=?, order_status_id=? WHERE id=?";
          const update_Result = await db.query(update_SQL, ['Stripe', charge.id, transDate, charge.paid, 1, CartResult[0].id]);
  
          
          //console.log('Charge created:', charge);
          res.status(200).send({
            status: true,
            result: {
              message: "Charge successful",
            },
            errors: ""
          });
        } else {
            //console.error('Charge failed=>', charge);
          res.status(200).send({
            status: false,
            result: "",
            errors: "Charge failed",
            errorData: charge,
          });
        }
    } catch (err) {
        console.error('Error creating charge:', err);
        res.status(200).send({
          status: false,
          result: "",
          errors: "Charge failed",
          errorData: err,
        });
    }
  }
}


const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
  
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
  
    return code;
  };

  const calulateCartPrice = async (cartId)=>{
    try{
        const cart_SQL = "SELECT discount_amount, tax, shipping_cost, shipping_country FROM orders WHERE id=?";
        const cart_Result = await db.query(cart_SQL, [cartId]);

        const Item_SQL = "SELECT * FROM order_items WHERE order_id=?";
        const Items_Result = await db.query(Item_SQL, [cartId]);

        var subtotal = 0;
        Items_Result.forEach(async(item)=>{
            subtotal += item.quantity * item.price;
        });

        const discount = cart_Result[0].discount_amount;
        const tax = cart_Result[0].tax;
        const shipping_cost = cart_Result[0].shipping_cost;
        const total = (subtotal -discount)+ tax + shipping_cost;
        //console.log(subtotal,discount, tax, shipping_cost,"=>",total)

        const update_SQL = "UPDATE orders SET subtotal=?, total=? WHERE id=?";
        const update_Result = await db.query(update_SQL, [subtotal, total, cartId]);
        return total;
    } catch (error) {
       console.log(error)
    }  
  }

  exports.apiAddGiftCard = async (req, res) => {
    
    var {CartID, price, recipientName, recipientEmail, senderName, senderEmail, giftMessage, deliveryDate} = req.body;
    //validate request
    if (!req.body) {
        res.status(400).send({
        status: false,
        result: "",
        errors: "Request parameters can not be empty!",
        });
    }

    const user_id = req.user.userId;
    try {
        if(CartID!=""){
            const SQL = `SELECT * FROM orders WHERE user_id=? AND id=?`;
            const result = await db.query(SQL, [user_id, CartID]);
            if(result.length===0){
                //if CartID is not null but CartID is exists into order table then generate new CartID
                const Code = generateRandomCode(8);
                const insert_sql = `INSERT INTO orders SET user_id=?, code=?`;
                const insert_result = await db.query(insert_sql, [user_id, Code]);

                if (insert_result.insertId > 0) {
                    CartID = insert_result.insertId;
                }
            }
        }else{
            //if CartID is null then generate new CartID
            const Code = generateRandomCode(8);
            const insert_sql2 = `INSERT INTO orders SET user_id=?, code=?`;
            const insert_result2 = await db.query(insert_sql2, [user_id, Code]);

            if (insert_result2.insertId > 0) {
                CartID = insert_result2.insertId;
            }else{
                res.status(200).send({
                    status: false,
                    result: "",
                    errors: "Sorry! unable to generate Cart ID"
                });
            }
        }
        

        const GiftCard_Data = {
            recipientName: recipientName, 
            recipientEmail: recipientEmail, 
            senderName: senderName, 
            senderEmail: senderEmail, 
            giftMessage: giftMessage, 
            deliveryDate: deliveryDate
        };

        const insertItem_sql = `INSERT INTO order_items SET order_id=?, type=?, price=?, maxdate=?, order_data=?`;
        const insertItem_result = await db.query(insertItem_sql, [CartID, "GiftCard", price, deliveryDate, JSON.stringify(GiftCard_Data)]);
        if (insertItem_result.insertId > 0) {

            //calculating cart total and update into order table
            await calulateCartPrice(CartID);

             //adding user data in ActiveCampaign
            const activeUser = {
                first_name:recipientName,
                email: recipientEmail
            }
            addContactActiveCampaign(activeUser);

            res.status(200).send({
                status: true,
                result: { CartID: CartID },
                message: "Item has beed added into cart",
                errors: "",
            });
        }else{
            res.status(200).send({
                status: false,
                result: { CartID: CartID },
                message: "Sorry unable to add item into cart",
                errors: "",
            });
        }     

    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }
};

exports.apiCheckCoupon = async (req, res) => {
    const { CartID, Coupon } = req.params;
    const user_id = req.user.userId;

    try{

        const CouponSQL = `SELECT * FROM coupons WHERE code=?`;
        const CouponResult = await db.query(CouponSQL, [Coupon]);
   
        if (CouponResult.length > 0) {
            const CurrentDate = new Date();
            const ExpiryDate = new Date(CouponResult[0].expiry_date)
            //checking coupon expiry date
            if(ExpiryDate<CurrentDate){
                res.status(200).send({
                    status: false,
                    result: "",
                    errors: "Coupon has been expired",
                });
            }

            //checking user_limit of the coupon
            const UserSQL = `SELECT * FROM orders WHERE coupon=? AND user_id=?`;
            const UserResult = await db.query(UserSQL, [Coupon,user_id]);
            //console.log("user_limit=>",CouponResult[0].user_limit, UserResult.length)
            if(CouponResult[0].user_limit < UserResult.length){
                res.status(200).send({
                    status: false,
                    result: "",
                    errors: "Sorry! You were alread cross the redeem limit",
                });
            }

            const CartSQL = `SELECT * FROM orders WHERE user_id=? AND id=?`;
            const CartResult = await db.query(CartSQL, [user_id, CartID]);
            if(CartResult.length===0){
                res.status(200).send({
                    status: false,
                    result: "",
                    errors: "Sorry! wrong Cart ID"
                });
            }

            const CartItemSQL = `SELECT * FROM order_items WHERE order_id=?`;
            const CartItemResult = await db.query(CartItemSQL, [CartID]);
            
            //calculating amount on which discount will be applied
            var Amount = CartResult[0].subtotal;
            if(CouponResult[0].item_limit > 0 && CartItemResult[0].quantity>CouponResult[0].item_limit){
                Amount = CouponResult[0].item_limit*CartItemResult[0].price
            }

            const discountAmt =  (CouponResult[0].discount_type=="$" ? CouponResult[0].discount_amount: (Amount*CouponResult[0].discount_amount)/100).toFixed(2);
            const totalAmt = (CartResult[0].subtotal - discountAmt)+CartResult[0].tax+CartResult[0].shipping_cost;
            //console.log("Amount=>",CartResult[0].subtotal,Amount,discountAmt, totalAmt);
            const update_SQL = "UPDATE orders SET coupon=?, discount_amount=?, total=? WHERE id=? AND user_id=?";
            const update_Result = await db.query(update_SQL, [Coupon, discountAmt, totalAmt, CartID, user_id]);

            //update coupon used counting
            const newUsedCount = Number.isFinite(CouponResult[0].used) ? CouponResult[0].used + 1 : 1;
            const update_SQL2 = "UPDATE coupons SET used_count=? WHERE code=?";
            const update_Result2 = await db.query(update_SQL2, [newUsedCount,Coupon]);

            const SQL2 = "SELECT * FROM orders WHERE id=?";
            const CartResult2 = await db.query(SQL2, [CartID]);

            res.status(200).send({
                status: true,
                result: {message: "Coupon Applied", Cart: CartResult2[0] },
                errors:"",
            });

        }else{
            res.status(200).send({
                status: false,
                result: "",
                errors: "Invalid Coupon",
            });
        }
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }


}

exports.apiRemoveCoupon = async (req, res) => {
    const { CartID } = req.params;
    const user_id = req.user.userId;

    try{

        const SQL = `SELECT * FROM orders WHERE id=? AND user_id=?`;
        const Result = await db.query(SQL, [CartID, user_id]);
  
        if (Result.length > 0) {

            const subTotal = Result[0].subtotal;
            const totalAmt = subTotal + Result[0].tax + Result[0].shipping_cost;

            const update_SQL = "UPDATE orders SET coupon=?, discount_amount=?, total=? WHERE id=? AND user_id=?";
            const update_Result = await db.query(update_SQL, ['', 0, totalAmt, CartID, user_id]);

            if(Result[0].coupon!="")
            {
                // Check if Result[0].used is a valid number
                const newUsedCount = Number.isFinite(Result[0].used) ? Result[0].used - 1 : 0;

                const update_SQL2 = "UPDATE coupons SET used_count=? WHERE code=?";
                const update_Result2 = await db.query(update_SQL2, [newUsedCount,Result[0].coupon]);
            }
            const CART_SQL = `SELECT * FROM orders WHERE user_id=? AND id=?`;
            const CART_Result = await db.query(CART_SQL, [user_id, CartID]);


            const SQL2 = "SELECT * FROM orders WHERE id=?";
            const CartResult2 = await db.query(SQL2, [CartID]);

            res.status(200).send({
                status: false,
                result: {message:"Coupon Removed successfully", Cart: CartResult2[0] },
                errors:"",
            });

        }else{
            res.status(200).send({
                status: false,
                result: "",
                errors: "Sorry! wrong Cart ID"
            });
        }
    } catch (error) {
        res.status(500).send({
            status: false,
            result: "",
            errors: " Error: " + error,
            errorData: error,
        });
    }


}

const addContactActiveCampaign = (user)=>{
    const ACTIVECAMPAIGN_URL = process.env.ACTIVECAMPAIGN_URL;
    const ACTIVECAMPAIGN_TOKEN = process.env.ACTIVECAMPAIGN_TOKEN;
    const LISTID = process.env.ACTIVECAMPAIGN_LISTID1;
    const ACCOUNT_NAME = process.env.ACTIVECAMPAIGN_ACCOUNT_NAME;
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept',
      'Content-Type': 'application/x-www-form-urlencoded', // Example header
      'API-TOKEN': `${ACTIVECAMPAIGN_TOKEN}`, // Example authorization header
    };
    const postData = new URLSearchParams();
    postData.append('api_action', 'contact_add');
    postData.append('api_output', 'json');
    postData.append('email', user.email);
    postData.append('first_name', user.first_name || '');
    postData.append('last_name', user.last_name || '');
    postData.append('phone', user.phone || '');
    postData.append('customer_acct_name', ACCOUNT_NAME);
    postData.append(`p[${LISTID}]`, LISTID);
    postData.append(`status[${LISTID}]`, 1);
    //postData.append(`instantresponders[${LISTID}]`, headers,LISTID);
  
   //console.log("ACTIVECAMPAIGN request=>", postData);
  
    axios.post(
      `${ACTIVECAMPAIGN_URL}/admin/api.php`, postData,{ headers }
    ).then(response => {
      console.log("ACTIVECAMPAIGN response=>", response.data);
      
      
     
    }).catch(error => {
      console.error('Error fetching ACTIVECAMPAIGN response data:', error);
      
    }); 
  }