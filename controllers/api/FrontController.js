const db = require('../../database/db');
const crypto = require('../../services/crypto');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASEURL;

/*------------------ Supportive functions ---------------------------*/
const updateImagesPath = async(item)=>{
    return item.map(item => ({
     ...item,
     image: (item.image && item.image!="")? item.image.replace('/uploads', baseUrl+'/uploads'):'',
   }));
 }
 const updateProfilePath = async(item)=>{
  return item.map(item => ({
   ...item,
   profile_img: (item.profile_img && item.profile_img!="")? item.profile_img.replace('/uploads', baseUrl+'/uploads'):'',
 }));
}
const updateBannerPath = async(item)=>{
  return item.map(item => ({
   ...item,
   banner: (item.banner && item.banner!="")? item.banner.replace('/uploads', baseUrl+'/uploads'):''
 }));
}
const updateLayoutPath = async(item)=>{
  return item.map(item => ({
   ...item,
   left_image: (item.left_image && item.left_image!="")? item.left_image.replace('/uploads', baseUrl+'/uploads'):'',
   right_image: (item.right_image && item.right_image!="")? item.right_image.replace('/uploads', baseUrl+'/uploads'):''
 }));
}
const updateCoverPath = async(item)=>{
  return item.map(item => ({
   ...item,
   front_image: (item.front_image && item.front_image!="")? item.front_image.replace('/uploads', baseUrl+'/uploads'):'',
   back_image: (item.back_image && item.back_image!="")? item.back_image.replace('/uploads', baseUrl+'/uploads'):''
 }));
}
const updateAddinsPath = async(item)=>{
  return item.map(item => ({
   ...item,
   image: (item.image && item.image!="")? item.image.replace('/uploads', baseUrl+'/uploads'):'',
   image2: (item.image2 && item.image2!="")? item.image2.replace('/uploads', baseUrl+'/uploads'):''
 }));
}
 /*------------------ Supportive functions ---------------------------*/

  exports.getHomeContent = async (req, res) => {
  
    try {
  
      const slider_sql = `SELECT id,title, image, btn_text, btn_link FROM slider WHERE status='1' AND image!='' ORDER BY sequence ASC`;
      var sliders = await db.query(slider_sql);
      sliders = await updateImagesPath(sliders);

      const story_sql = `SELECT stories.id, users.first_name, users.last_name, users.profile_img, stories.comments, stories.image, stories.created_at FROM stories, users WHERE stories.user_id=users.id ORDER BY id DESC`;
      var stories = await db.query(story_sql);
      stories = await updateImagesPath(stories);
      stories = await updateProfilePath(stories);

      const page_id = 1;
      const page_sql = `SELECT * FROM pages WHERE  id=?`;
      var pages = await db.query(page_sql,[page_id]);
      pages = await updateBannerPath(pages);

      const cover_sql = `SELECT  id, title, price, description, front_image, back_image FROM cover_items WHERE status='1' AND cat_id='3' ORDER BY title ASC LIMIT 0, 12` ;
      var covers = await db.query(cover_sql);
      covers = await updateCoverPath(covers);
      for (const [index, item] of covers.entries()) {
        const image_sql = `SELECT image FROM cover_images WHERE cover_id=?`;
        var cover_images = await db.query(image_sql, [item.id]);
        cover_images = await updateImagesPath(cover_images);
        covers[index].images = cover_images;
      }

      res.status(200).send({ 
        status: true, 
        result: { 
            sliders: sliders,
            stories: stories,
            covers: covers,
            page: pages[0],
        }, 
        errors: "" 
      });
      
  
    } catch (error) {
      res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };


  exports.getPageContent = async (req, res) => {
    page_id = req.params.id
   
    try {
  
      const page_sql = `SELECT * FROM pages WHERE  id=?`;
      var pages = await db.query(page_sql,[page_id]);
      pages = await updateBannerPath(pages);

      res.status(200).send({ 
        status: true, 
        result: { 
           page: pages[0],
        }, 
        errors: "" 
      });
      
  
    } catch (error) {
      res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };

  exports.getCovers = async (req, res) => {

    try {

        const cat_sql = `SELECT id, title FROM cover_categories WHERE status='1' ORDER BY title ASC`;
        const cover_categories = await db.query(cat_sql);

        const cover_sql = `SELECT c.id AS cat_id, i.id, i.title, i.price, i.description, i.front_image, i.back_image FROM cover_categories c LEFT JOIN cover_items i ON c.id = i.cat_id WHERE i.status='1' AND c.status='1' ORDER BY i.cat_id, i.title ASC` ;
        var covers = await db.query(cover_sql);
        covers = await updateCoverPath(covers);

        for (const [index, item] of covers.entries()) {
          const image_sql = `SELECT image FROM cover_images WHERE cover_id=?`;
          var cover_images = await db.query(image_sql, [item.id]);
          cover_images = await updateImagesPath(cover_images);
          covers[index].images = cover_images;
        }

        
        const coverListing = Object.entries(
          covers.reduce((acc, cat) => {
            if (!acc[cat.cat_id]) {
              acc[cat.cat_id] = [];
            }
            acc[cat.cat_id].push(cat);
            return acc;
          }, {})
        ).map(([cat_id, coverList]) => ({
          cat_id: parseInt(cat_id), // Convert cat_id to a number if needed
          coverList,
        }));
        
        res.status(200).send({ 
            status: true, 
            result: { 
                categories: cover_categories,
                covers: coverListing
            }, 
            errors: "" 
        });
        
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
   
  };

  exports.getLayouts = async (req, res) => {
    const type = req.params.type;

    try {

      const layout_sql = `SELECT id, title, left_image, right_image, isDefault, options FROM layouts WHERE status='1' AND slug=? ORDER BY id ASC`;
      var layouts = await db.query(layout_sql,[type]);
      layouts = await updateLayoutPath(layouts);

      const quote_sql = `SELECT * FROM quotes WHERE status='1' ORDER BY id ASC LIMIT 0,10`;
      var quoteList = await db.query(quote_sql);
  
      var sectionOpts = {}
      var sections = {}; // Initialize an empty object
      var optList = {}; // Initialize an empty object
      var ImageArr = {}; // Initialize an empty object

      
      if(type=="DailySingle" || type=="DailyTwo"){

        const layout_id = layouts[0].id;
        const block_sql = `SELECT * FROM layout_options WHERE layout_id=? AND status='1' ORDER BY sequence, id ASC`;
        var optList = await db.query(block_sql, [layout_id]);
    
        sectionOpts = optList.reduce((acc, sec) => {
          if (!acc[sec.section_id]) {
            acc[sec.section_id] = [];
          }
          acc[sec.section_id].push(sec);
          return acc;
        }, {})
    
        const block_sql2 = `SELECT * FROM layout_options WHERE layout_id=? ORDER BY sequence, id ASC`;
        var optList2 = await db.query(block_sql2, [layout_id]);
        optList2 = await updateLayoutPath(optList2);
        optList2.forEach((opt) => {
          ImageArr[opt.id] = {'left_image': opt.left_image, 'right_image': opt.right_image}; // Assign image to the key based on id
        });


        const section_sql = `SELECT section_title, default_val FROM layout_sections WHERE status='1' AND layout_id=?`;
        sections = await db.query(section_sql, [layout_id]);

        res.status(200).send({ 
          status: true, 
          result: { 
              layouts: layouts,
              sections: sections,
              sectionOpts: sectionOpts,
              imgData: ImageArr,
              quoteList:quoteList
          }, 
          errors: "" 
        });
          
      }
      if(type=="WeeklyView"){

        const layout_ids = layouts.map((item)=> parseInt(item.id));
        //console.log(layout_ids);
        const block_sql = `SELECT * FROM layout_options WHERE status='1' AND layout_id IN (?) ORDER BY sequence, id ASC`;
        var optList = await db.query(block_sql, [layout_ids]);
    
        sectionOpts = optList.reduce((acc, sec) => {
          if (!acc[sec.section_id]) {
            acc[sec.section_id] = [];
          }
          acc[sec.section_id].push(sec);
          return acc;
        }, {})
    
        const block_sql2 = `SELECT * FROM layout_options WHERE layout_id IN (?) ORDER BY sequence, id ASC`;
        var optList2 = await db.query(block_sql2, [layout_ids]);
        optList2 = await updateLayoutPath(optList2);
        optList2.forEach((opt) => {
          ImageArr[opt.id] = {'left_image': opt.left_image, 'right_image': opt.right_image}; // Assign image to the key based on id
        });


        const section_sql = `SELECT s.id, s.layout_id, s.section_title, s.default_val, s.clone_section FROM layout_sections s, layouts l WHERE l.id=s.layout_id AND l.status='1' AND s.status='1' AND l.slug=?`;
        const sectionList = await db.query(section_sql, [type]);
        
        for (const section of sectionList) {
          const { layout_id } = section;
        
          if (!sections[layout_id]) {
            sections[layout_id] = [];
          }
        
          sections[layout_id].push(section);
        }

        res.status(200).send({ 
          status: true, 
          result: { 
              layouts: layouts,
              sections: sections,
              sectionOpts: sectionOpts,
              imgData: ImageArr,
              quoteList:quoteList
          }, 
          errors: "" 
        });
  
      }

      if(type=="CalendarView"){
        const layout_ids = layouts.map((item)=> parseInt(item.id));
        //console.log(layout_ids);
        const block_sql = `SELECT * FROM layout_options WHERE status='1' AND layout_id IN (?)`;
        var optList = await db.query(block_sql, [layout_ids]);
        optList = await updateLayoutPath(optList);
    
         sectionOpts = optList.reduce((acc, sec) => {
          if (!acc[sec.section_id]) {
            acc[sec.section_id] = [];
          }
          acc[sec.section_id].push(sec);
          return acc;
        }, {})
    
        const block_sql2 = `SELECT * FROM layout_options WHERE layout_id IN (?)`;
        var optList2 = await db.query(block_sql2, [layout_ids]);
        optList2 = await updateLayoutPath(optList2);
        optList2.forEach((opt) => {
          ImageArr[opt.id] = {'left_image': opt.left_image, 'right_image': opt.right_image}; // Assign image to the key based on id
        });


        const section_sql = `SELECT s.id, s.layout_id, s.section_title, s.default_val, s.clone_section FROM layout_sections s, layouts l WHERE l.id=s.layout_id AND l.status='1' AND s.status='1' AND l.slug=?`;
        const sectionList = await db.query(section_sql, [type]);
        
        for (const section of sectionList) {
          const { layout_id } = section;
        
          if (!sections[layout_id]) {
            sections[layout_id] = [];
          }
        
          sections[layout_id].push(section);
        }

        const template_sql = `SELECT c.* FROM calendar_templates c, layouts l WHERE l.id=c.layout_id AND c.status='1'`;
        var TemplateList = await db.query(template_sql);
        TemplateList = await updateAddinsPath(TemplateList);
        const templates = {};
        for (const template of TemplateList) {
          const { layout_id } = template;
        
          if (!templates[layout_id]) {
            templates[layout_id] = [];
          }
        
          templates[layout_id].push(template);
        }

        res.status(200).send({ 
          status: true, 
          result: { 
              layouts: layouts,
              sections: sections,
              sectionOpts: sectionOpts,
              templates: templates
          }, 
          errors: "" 
        });

      } 
        
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
   
  };


  
  exports.getAddins = async (req, res) => {
    const type = req.params.type;

    var templateList = [];
    try {
        
        const addins_sql = `SELECT * FROM addins_templates WHERE type=? AND status='1'  ORDER BY id ASC`;
        templateList = await db.query(addins_sql, [type]);
        templateList = await updateAddinsPath(templateList);

        res.status(200).send({ 
          status: true, 
          result: { 
            templateList: templateList,
          }, 
          errors: "" 
        });
        
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
   
  };

  exports.getHolidayDates = async (req, res) => {

    try {
      
      const holiday_sql = `SELECT * FROM holidays WHERE status='1' ORDER BY holiday_type, title ASC`;
      var holidayOpts = await db.query(holiday_sql);
  
      const holidayList = holidayOpts.reduce((acc, sec) => {
        if (!acc[sec.holiday_type]) {
          acc[sec.holiday_type] = [];
        }
        acc[sec.holiday_type].push(sec);
        return acc;
      }, {})
    

      //const date_sql = `SELECT * FROM holiday_dates WHERE status='1' ORDER BY holiday_id, event_date ASC`;
      const date_sql = `SELECT MIN(id) as id, title, holiday_id, MIN(event_date) AS min_event_date FROM holiday_dates GROUP BY holiday_id, title ORDER BY holiday_id, min_event_date ASC`
      var dateList = await db.query(date_sql);
  
      const holidayDates = dateList.reduce((acc, sec) => {
        if (!acc[sec.holiday_id]) {
          acc[sec.holiday_id] = [];
        }
        acc[sec.holiday_id].push(sec);
        return acc;
      }, {})
      
      res.status(200).send({ 
        status: true, 
        result: { 
          holidayList: holidayList,
          holidayDates: holidayDates
        }, 
        errors: "" 
      });

    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
   
  };
  
  exports.getMyAccountInfo = async (req, res) => {
    const user_id = req.user.userId;
    try {
      
      const user_sql = `SELECT * FROM users WHERE status='1' AND id=?`;
      var userResult = await db.query(user_sql, [user_id]);
  
      if(userResult.length>0){
        const order_sql = `SELECT o.*, s.title as status_title FROM orders o LEFT JOIN order_status s ON o.order_status_id=s.id WHERE payment_status='1' AND user_id=? ORDER BY id DESC LIMIT 0,5`;
        var orderResult = await db.query(order_sql, [user_id]);
   
        const save_sql = `SELECT * FROM user_savedata WHERE user_id=? ORDER BY id DESC LIMIT 0,5`;
        var saveResult = await db.query(save_sql, [user_id]);

        res.status(200).send({ 
          status: true, 
          result: { 
            User: userResult[0],
            Orders: orderResult,
            SaveData: saveResult
          }, 
          errors: "" 
        });

      }else{
        res.status(200).send({ 
          status: false, 
          result: "", 
          errors: "Invaild Token" 
        });
      }
      
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
  };

  exports.getMyOrders = async (req, res) => {
    const user_id = req.user.userId;

    try {
      
      const user_sql = `SELECT * FROM users WHERE status='1' AND id=?`;
      var userResult = await db.query(user_sql, [user_id]);
  
      if(userResult.length>0){
        const order_sql = `SELECT o.*, s.title as status_title FROM orders o LEFT JOIN order_status s ON o.order_status_id=s.id WHERE payment_status='1' AND user_id=? ORDER BY id DESC`;
        var orderResult = await db.query(order_sql, [user_id]);

        res.status(200).send({ 
          status: true, 
          result: { 
            User: userResult[0],
            Orders: orderResult
          }, 
          errors: "" 
        });

      }else{
        res.status(200).send({ 
          status: false, 
          result: "", 
          errors: "Invaild Token" 
        });
      }
      
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
  };

  
  exports.saveprofile = async (req, res) => {
    const user_id = req.user.userId;
    const {firstName, lastName, email, currentPassword, newPassword } = req.body;

    try {
      const user_sql = `SELECT * FROM users WHERE status='1' AND id=?`;
      var userResult = await db.query(user_sql, [user_id]);
  
      if(userResult.length>0){
        const save_sql = `UPDATE users SET first_name=?, last_name=? WHERE id=?`;
        var Result = await db.query(save_sql, [firstName, lastName, user_id]);

        if(email!=""){
          const email_sql = `UPDATE users SET email=? WHERE id=?`;
          var emailResult = await db.query(email_sql, [email, user_id]);
          
        }

        // Compare the provided password with the hashed password in the database
        const user_password = crypto.decrypt(userResult[0].password);
        if(currentPassword!="" && newPassword!="" && currentPassword==user_password)
        {
          const newEncrytedPassword = crypto.encrypt(newPassword);

          const pass_sql = `UPDATE users SET password=? WHERE id=?`;
          var passResult = await db.query(pass_sql, [newEncrytedPassword, user_id]);
        }

        res.status(200).send({ 
          status: true, 
          result: { 
            message: "Profile Information saved successfully"
          }, 
          errors: "" 
        });

      }else{
        res.status(200).send({ 
          status: false, 
          result: "", 
          errors: "Invaild Token" 
        });
      }
      
    } catch (error) {
        res.status(500).send({ status: false, result: "", errors:"Error: "+error, errorData:error });
    }
  };

  exports.getGiftCardImages = async (req, res) => {
   
    try {
      const giftcard_sql = `SELECT * FROM gift_cards WHERE  status='1'`;
      var giftcards = await db.query(giftcard_sql);
      giftcards = await updateImagesPath(giftcards);

      res.status(200).send({ 
        status: true, 
        result: { 
          giftcards: giftcards
        }, 
        errors: "" 
      });
      
  
    } catch (error) {
      res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };
  
  exports.getSiteDetail = async (req, res) => {
   
    try {
      const setting_sql = `SELECT * FROM settings`;
      var setting = await db.query(setting_sql);

      res.status(200).send({ 
        status: true, 
        result: { 
          setting: setting
        }, 
        errors: "" 
      });
      
  
    } catch (error) {
      res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };
