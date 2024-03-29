const db = require('../../database/db');
const ejs = require('ejs');
require("dotenv").config();
const path = require('path');
const fs = require('fs/promises');
const fs1 = require('fs');
const baseUrl = process.env.BASEURL;
const puppeteer = require('puppeteer');
//var html_to_pdf = require('html-pdf-node');

 /*------------------ Supportive functions ---------------------------*/

  exports.generatePDF = async (req, res) => {
  
    const postData = req.body;
    const Code = postData.Code;
    const CoverData = JSON.parse(postData.Cover);

    //console.log("CoverData=>",CoverData);
    //console.log("Files=>",req.files);

    try {
      
      //generating cover pdf
      var pdfCover = "";
      if (CoverData.CoverType === "Custom") {
        pdfCover = await generateCover(Code, CoverData.CoverType, req.files);
     }

      //generating preview pdf
      // Read the HTML template based on the template name
      const pdfPreviewName = `Diary_${Code}.pdf`;
      const pdfPreviewPath = path.join(__dirname, '../../public/pdfs', pdfPreviewName);
      console.log("pdfPath=>",pdfPreviewPath)

      const pdfPreviewOptions = {
        path: pdfPreviewPath,
        //format: 'letter',
        width: '7.5in',
        height: '10in',
        margin: {
          top: '0.125in',  // 10in (height) - 7.25in (text margin)
          right: '0.125in',  // 7.5in (width) - 9.75in (text margin)
          bottom: '0.125in',
          left: '0.125in',
        },
        printBackground: true,
        cache: false // Disable caching
      };
      
      //generating print pdf parallel 
      generatePrintPDF( postData );

      console.log('Start generating preview pdf')
      // Read the HTML template based on the template name
      const previewContent = await readHtmlTemplate(postData,"preview");
      console.log("postData=>",postData,pdfPreviewOptions);
      const browser = await puppeteer.launch({headless: 'new'});
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0); 
      
      await page.setContent(previewContent);

      await page.pdf(pdfPreviewOptions);
      //console.log("postData2=>")
      await browser.close();
      console.log('Generated preview pdf')

      res.status(200).json({ 
        status: true, 
        result: { 
          pdfPath: pdfPreviewName,
          pdfCoverPath: pdfCover
        }, 
        errors: "" 
      });

      
    } catch (error) {
      console.log(error);
      //res.status(500).json({ error: 'An error occurred while generating the PDF.' });
      res.status(500).send({ status: false, result: "", errors:error });
    }
   
  };


  async function generatePrintPDF( postData ){

    console.log('Start generating print pdf')
    //generating Print pdf
    // Read the HTML template based on the template name
    const Code = postData.Code;
    const pdfPrintName = `Diary_Print_${Code}.pdf`;
    const pdfPrintPath = path.join(__dirname, '../../public/pdfs', pdfPrintName);

    const pdfPrintOptions = {
      path: pdfPrintPath,
      //format: 'letter',
      width: 7.5*300,
      height: 10*300,
      margin: {
        top: '0.125in',  // 10in (height) - 7.25in (text margin)
        right: '0.125in',  // 7.5in (width) - 9.75in (text margin)
        bottom: '0.125in',
        left: '0.125in',
      },
      printBackground: true,
      cache: false, // Disable caching
      timeout: 200000
    };

    const printContent = await readHtmlTemplate(postData,"print");

    console.log("pdfPrintOptions=>",pdfPrintPath, pdfPrintOptions);
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    
    page.setDefaultNavigationTimeout(0); 

    await page.setContent(printContent);
    await page.pdf(pdfPrintOptions);
    await browser.close();
    console.log('Generated print pdf')

  }

  async function generateCover(Code, CoverType, files) {
    // cover generation logic
    var pdfCoverFilename = "";

    var FrontCoverImage = "";
    var BackCoverImage = "";

    if(files.FrontCoverImg){
      FrontCoverImage = files.FrontCoverImg[0].filename;
    }
    
    if(files.BackCoverImg){
      BackCoverImage = files.BackCoverImg[0].filename;
    }

    pdfCoverFilename = `Diary_Cover_${Code}.pdf`;
    pdfCoverPath = path.join(__dirname, '../../public/pdfs', pdfCoverFilename);
    console.log("pdfCoverPath=>",pdfCoverPath);

    const pdfCoverOptions = {
      path: pdfCoverPath,
      width: '8.375in',
      height: '10.875in',
      margin: {
        top: '0.5in',  // 10.875in (height with wrap) - 9.875in (height artwork)
        right: '0.5in',  // 8.375in (width with wrap) - 7.375in (width artwork)
        bottom: '0.5in',
        left: '0.5in',
      },
      printBackground: true,
    };
        
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();

    const CoverContent =  getCoverHTML (`${baseUrl}/pdfs/${FrontCoverImage}`, `${baseUrl}/pdfs/${BackCoverImage}` );
    await page.setContent(CoverContent);
    await page.pdf(pdfCoverOptions);

    await browser.close();
    

    if (FrontCoverImage) {
      const FrontImagePath = path.join(__dirname, '../../public/pdfs/', FrontCoverImage);
      await fs.access(FrontImagePath); // Check if the file exists
      await fs.unlink(FrontImagePath);
    }

    if (BackCoverImage) {
      const BackImagePath = path.join(__dirname, '../../public/pdfs/', BackCoverImage);
      await fs.access(BackImagePath); // Check if the file exists
      await fs.unlink(BackImagePath);
    }

    return pdfCoverFilename; // replace with the actual path
  }

  function getCoverHTML (FrontCoverImage, BackCoverImage ){
    
    var CoverHTML = "";
    const CoverTemplate = path.join(__dirname, '../../views/DiaryPages', `CoverPage.ejs`);
    ejs.renderFile(CoverTemplate, {FrontImage:FrontCoverImage, BackImage:BackCoverImage}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      CoverHTML = str;
    });
    
    return CoverHTML;
  }

  async function readHtmlTemplate(data, pdftype) {
    // Load and process your HTML template, replacing placeholders with data.
    // You can use a templating engine like EJS or handlebars for this.

    //layout images
    const templateDir = pdftype=="print" ? "DiaryPages" : "DiaryPagesSmall"
    

    var ImageArr = {};
    const CalenderTemplates = {};
    const AddinsTemplates = {};

    const block_sql = `SELECT id, left_image, right_image, print_left_image, print_right_image  FROM layout_options`;
    var optList = await db.query(block_sql);
    optList.forEach((opt) => {
      ImageArr[opt.id] = {
        'left_image': pdftype=="print" ? baseUrl+opt.print_left_image : baseUrl+opt.left_image,
        'right_image': pdftype=="print" ? baseUrl+opt.print_right_image : baseUrl+opt.right_image
      }; // Assign image to the key based on id
    });

    
    const calender_sql = `SELECT id, image, image2, print_image, print_image2  FROM calendar_templates`;
    var CalenderTemplateList = await db.query(calender_sql);
    CalenderTemplateList.forEach((template) => {
      CalenderTemplates[template.id] = {
        'left_image': pdftype=="print" ? baseUrl+template.print_image :  baseUrl+template.image, 
        'right_image': pdftype=="print" ? baseUrl+template.print_image2 :  baseUrl+template.image2
      }; // Assign image to the key based on id
    });

      
    const addins_sql = `SELECT id, image, image2, print_image, print_image2  FROM addins_templates `;
    var AddinsTemplateList = await db.query(addins_sql);
    AddinsTemplateList.forEach((template) => {
      AddinsTemplates[template.id] = {
        'left_image': pdftype=="print" ? baseUrl+template.print_image : baseUrl+template.image, 
        'right_image': pdftype=="print" ? baseUrl+template.print_image2 : baseUrl+template.image2
      }; // Assign image to the key based on id
    });

    

    const quote_sql = `SELECT * FROM quotes WHERE status='1' ORDER BY id ASC`;
    const quoteList = await db.query(quote_sql);

    var FirstPageData = JSON.parse(data.FirstPage);
    const LayoutData = JSON.parse(data.Layout);
    const CalendarData = JSON.parse(data.Calendar);
    const AddinsData = JSON.parse(data.Addins);
    const DatesData = JSON.parse(data.Dates);

    const startDate = new Date(DatesData.EventDate.startDate);
    const endDate = new Date(DatesData.EventDate.endDate);
 
   
console.log(startDate, endDate, FirstPageData, LayoutData, CalendarData, AddinsData, DatesData)
   

    const HolidayDates = [];
    const DateGroup = DatesData.presentEvent.childCheckboxes;
    const selectedDates = DatesData.presentEvent.selectedDates;
    var holiday_groups = [];
    var selectedTitles = [];

    for (const key in DateGroup) {
      if (DateGroup[key] == true) {
        holiday_groups.push(key);
      }
    }
    holiday_groups = holiday_groups.join(', ');

    for (const key in selectedDates) {
      if (selectedDates[key] === true) {
        selectedTitles.push(key);
      }
    }
    const titlesString = selectedTitles.join(', ');

    var HolidayDatesList = [];

    if(holiday_groups.length>0){
        const holiday_sql2 = `SELECT hd.*, h.title as htitle, h.holiday_type FROM holiday_dates hd LEFT JOIN holidays h ON hd.holiday_id=h.id WHERE hd.status='1' AND h.status='1' AND hd.id IN (${titlesString}) AND hd.holiday_id IN (${holiday_groups}) AND hd.event_date >= ? AND hd.event_date <= ?`;
        HolidayDatesList = await db.query(holiday_sql2,[startDate, endDate]);
   
        HolidayDatesList.forEach((dt) => {
          HolidayDates.push({'holiday_type': dt.holiday_type, 'htitle': dt.htitle, 'title': dt.title, 'date': dt.event_date});
        });
    }
    //console.log("HolidayDates", HolidayDates)

    //get current week start date
    const startDayText = DatesData.EventDate.startDayText;
    const maxLengthText = DatesData.EventDate.maxLengthText;
    
    const startDay = startDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startDaysToSubtract = startDay === 0 ? 5 : startDay - 1; // Calculate days to subtract
    const startWeekDay= startDate;
    startWeekDay.setDate(startWeekDay.getDate() - startDaysToSubtract); // Subtract days to get the start of the week
    
    const endDay = endDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const endDaysToSubtract = endDay === 0 ? 6 : endDay - 1; // Calculate days to subtract
    const endWeekDay= endDate;
    endWeekDay.setDate(endWeekDay.getDate() - endDaysToSubtract); // Subtract days to get the start of the week

    //calculate Renewal Date
    const renewalDate = new Date(endDate);
    renewalDate.setDate(endWeekDay.getDate() - 21)

    const currentDate = startWeekDay;
    var MonthCount = (endDate.getMonth()-startDate.getMonth())+1;
 

    var templateContent = "";

    // Render the EJS template and store the HTML content in a variable
    if(FirstPageData===null){
      FirstPageData = {};
    }
    FirstPageData['BaseUrl'] = baseUrl;
    const FirstPagePath = path.join(__dirname, `../../views/${templateDir}`, `FirstPage.ejs`);
    const FirstPageHTML = getFirstPageHTML(FirstPagePath, FirstPageData)
    templateContent += FirstPageHTML;
    //console.log(templateContent)
    
    // Front of Planner
    console.log("Front of Planner");
    var FrontPlannerHtml = getAddinsPlannerHTML("Front of Planner", AddinsData, AddinsTemplates, templateDir);
    FrontPlannerHtml += getYearAtGlanceCalendarHTML("Front of Planner", CalendarData, CalenderTemplates, templateDir)
    FrontPlannerHtml += getExtraMonthlyCalendarHTML(MonthCount,'Monthly',"Front of Planner", CalendarData, CalenderTemplates, startWeekDay, DatesData, HolidayDates, templateDir)
    templateContent +=  FrontPlannerHtml;

    //for  back of planner  Monthly calender
    var EndPlannerHtml = getExtraMonthlyCalendarHTML(MonthCount,'Monthly', 'Back of Planner', CalendarData, CalenderTemplates, startWeekDay, DatesData, HolidayDates, templateDir);
    
    

    const quoteIndices = {
      1: 0,
      2: 0,
      3: 0
    };

    var pageCount = 0;
    var showAddin = "";
    var showRenewal = 0;

    while (currentDate <= endDate) {
      
      
      // Quarterly Planner
      if ((currentDate.getMonth() % 3 === 0 && currentDate.getDate() === 1) || (showAddin==="Quarterly Planner" && currentDate.getMonth() % 3 === 0 && currentDate.getDate() === 2)) {
        if(pageCount%2==0 || showAddin==="Quarterly Planner"){
          console.log("Quarterly Planner", currentDate, pageCount);
          var QuarterlyPlannerHtml = getAddinsPlannerHTML("Quarterly", AddinsData, AddinsTemplates, templateDir);
          templateContent += QuarterlyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }else{
          showAddin="Quarterly Planner";
        }
      }

      // Monthly Planner for daily single page and daily two page
      if ((LayoutData.DailySinglePage!==undefined || LayoutData.DailyTwoPage!==undefined) && currentDate.getDate() === 1 ) {
        if(pageCount%2==0 || showAddin==="Monthly Planner"){
          console.log("Monthly Planner", currentDate, pageCount);
          var MonthlyPlannerHtml = getAddinsPlannerHTML("Monthly", AddinsData, AddinsTemplates, templateDir);
          MonthlyPlannerHtml += getMonthlyCalendarHTML("Monthly", CalendarData, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir);
          templateContent += MonthlyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }
      }

      // Monthly Planner for weeklyview page when month start from week start
      if (WViewPageData!==undefined) {
        const wdata = calculateWeek(currentDate);
        if(pageCount%2==0 && currentDate.getDate() === 1 && currentDate.getTime() === wdata['StartDate'].getTime())
        {
          console.log("Monthly Planner", currentDate, pageCount);
          var MonthlyPlannerHtml = getAddinsPlannerHTML("Monthly", AddinsData, AddinsTemplates, templateDir);
          MonthlyPlannerHtml += getMonthlyCalendarHTML("Monthly", CalendarData, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir);
          templateContent += MonthlyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }
      }
    
      
      
      // Weekly Planner
      if ( currentDate.getDay() === 0) {
        
        //rendering WeeklyViewPage HTML
        var WViewPageData = LayoutData.WeeklyView;
        if(WViewPageData!==undefined)
        {
          WViewPageData['BaseUrl'] = baseUrl;
          const wdata = calculateWeek(currentDate);
          WViewPageData = { ...WViewPageData, ...wdata };
          const WeeklyViewPagePath = path.join(__dirname, `../../views/${templateDir}`, `WeeklyView.ejs`);
          const WeeklyViewPageHTML =  getWeeklyViewPageHTML(WeeklyViewPagePath, WViewPageData, ImageArr, currentDate, HolidayDates, quoteList, quoteIndices);
          templateContent += WeeklyViewPageHTML;
          //console.log(WeeklyViewPageHTML);
          pageCount+=2;
        
          
          console.log("Weekly Planner", currentDate, pageCount );
          var WeeklyPlannerHtml = getAddinsPlannerHTML("Weekly", AddinsData, AddinsTemplates,templateDir);
          templateContent += WeeklyPlannerHtml;
          pageCount+=2;
        }
      
      }

      //console.log(currentDate.getDate());

      //show monthly addins at weeklyview when month start in mide of the week then monthly addins after the current weekend
      if (WViewPageData!==undefined) {
        const wdata = calculateWeek(currentDate);
        if(pageCount%2==0 && (wdata['MonthChange'] && currentDate.getTime() === wdata['EndDate'].getTime()))
        {
          console.log("Monthly Planner", currentDate, pageCount);
          var MonthlyPlannerHtml = getAddinsPlannerHTML("Monthly", AddinsData, AddinsTemplates, templateDir);
          MonthlyPlannerHtml += getMonthlyCalendarHTML("Monthly", CalendarData, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir);
          templateContent += MonthlyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }
      }
      

      
      //rendering DailySinglePage HTML
      const DSPageData = LayoutData.DailySinglePage;
      
      if(DSPageData!==undefined)
      { console.log("DSPage", currentDate, pageCount)
        DSPageData['BaseUrl'] = baseUrl;
        DSPageData['Page'] = 'Left';
        if(pageCount%2==1){
          DSPageData['Page'] = 'Right';
        }
        const DailySinglePath = path.join(__dirname, `../../views/${templateDir}`, `DailySinglePage.ejs`);
        const DailySinglePageHTML =  getDailySinglePageHTML(DailySinglePath, DSPageData, ImageArr, currentDate, HolidayDates, quoteList, quoteIndices);
        templateContent += DailySinglePageHTML;
        //console.log(DailySinglePageHTML)
      
        pageCount+=1;

        if (currentDate.getDay() === 0){
          if (pageCount%2==0)
          {
            console.log("DSPage-Weekly Planner 1", currentDate, pageCount );
            var WeeklyPlannerHtml = getAddinsPlannerHTML("Weekly", AddinsData, AddinsTemplates, templateDir);
            WeeklyPlannerHtml += getYearAtGlanceCalendarHTML("Weekly", CalendarData, CalenderTemplates, templateDir)
            templateContent += WeeklyPlannerHtml;
            pageCount+=2;
            showAddin="";
          }else{
            showAddin="DSPage-Weekly";
         }
        }else if(currentDate.getDay() === 1 && showAddin==="DSPage-Weekly"){
          console.log("DSPage-Weekly Planner 2", currentDate, pageCount );
          var WeeklyPlannerHtml = getAddinsPlannerHTML("Weekly", AddinsData, AddinsTemplates, templateDir);
          WeeklyPlannerHtml += getYearAtGlanceCalendarHTML("Weekly", CalendarData, CalenderTemplates, templateDir)
          templateContent += WeeklyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }
      }


      //rendering DailyTwoPage HTML
      const DTPageData = LayoutData.DailyTwoPage;
      if(DTPageData!==undefined)
      {console.log("DTPage");
        DTPageData['BaseUrl'] = baseUrl;
        const DailyTwoPagePath = path.join(__dirname, `../../views/${templateDir}`, `DailyTwoPage.ejs`);
        const DailyTwoPageHTML =  getDailyTwoPageHTML(DailyTwoPagePath, DTPageData, ImageArr, currentDate, HolidayDates, quoteList, quoteIndices);
        templateContent += DailyTwoPageHTML;
       // console.log(DailyTwoPageHTML);
        pageCount+=2;

        if(currentDate.getDay() === 0){
          if(pageCount%2==0){
            console.log("DTPage-Weekly Planner 1", currentDate,pageCount );
            var WeeklyPlannerHtml = getAddinsPlannerHTML("Weekly", AddinsData, AddinsTemplates, templateDir);
            WeeklyPlannerHtml += getYearAtGlanceCalendarHTML("Weekly", CalendarData, CalenderTemplates, templateDir)
            templateContent += WeeklyPlannerHtml;
            pageCount+=2;
            showAddin="";
          }else{
            showAddin="DTPage-Weekly";
          }
        }else if (currentDate.getDay() === 1 && showAddin==="DTPage-Weekly") {  
          console.log("DTPage-Weekly Planner 2", currentDate,pageCount );
          var WeeklyPlannerHtml = getAddinsPlannerHTML("Weekly", AddinsData, AddinsTemplates, templateDir);
          WeeklyPlannerHtml += getYearAtGlanceCalendarHTML("Weekly", CalendarData, CalenderTemplates, templateDir)
          templateContent += WeeklyPlannerHtml;
          pageCount+=2;
          showAddin="";
        }
      }

      //Renewal Date
      //console.log(currentDate,renewalDate, currentDate.getTime()===renewalDate.getTime())
      if(currentDate.getTime()===renewalDate.getTime() || showRenewal==1)
      {
        if(pageCount%2==0){
          console.log("Renewal HTML", currentDate,renewalDate)
          var RenewalHTML = getRenwalTemplateHTML(ImageArr, templateDir );
          //console.log(RenewalHTML);
          templateContent +=  RenewalHTML;
          showRenewal=0;
        }else{
          showRenewal=1;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // End of Planner
    console.log("MonthCount2=>",MonthCount,startDate, endDate,startWeekDay)
    console.log("End of Planner",pageCount);

    if(CalendarData.monthlyPlannerRadio!=undefined && CalendarData.monthlyPlannerRadio!=null && CalendarData.monthlyPlannerRadio==246){
      EndPlannerHtml += getExtraMonthlyCalendarHTML(6, 'ExtraMonths', 'Back of Planner', CalendarData, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir);
    }
    if(CalendarData.monthlyPlannerRadio!=undefined && CalendarData.monthlyPlannerRadio!=null && CalendarData.monthlyPlannerRadio==247){
      EndPlannerHtml += getExtraMonthlyCalendarHTML(12, 'ExtraMonths', 'Back of Planner', CalendarData, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir);
    }
    EndPlannerHtml += getYearAtGlanceCalendarHTML('Back of Planner', CalendarData, CalenderTemplates, templateDir);
    EndPlannerHtml += getAddinsPlannerHTML('Back of Planner', AddinsData, AddinsTemplates, templateDir);
    templateContent += EndPlannerHtml;
    console.log("End")
  
    return templateContent;
  }



  function getFirstPageHTML (FirstPageTemplate, FirstPageData){
    
    var FirstPageHTML = "";
    ejs.renderFile(FirstPageTemplate, FirstPageData, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      FirstPageHTML = str;
    });

    return FirstPageHTML;
  }

  function getDailySinglePageHTML(DailySingleTemplate, DSPageData, ImageArr, currentDate, holidayDates, quoteList, quoteIndices){

    
    const dayOptions = { weekday: 'long' };
    const dateOptions = { month: 'long', day: 'numeric' };
    const currentDay = currentDate.toLocaleDateString('en-US', dayOptions);
    const currentMonthDate = currentDate.toLocaleDateString('en-US', dateOptions);

    const currentWeekInQuarter = getWeekQuarter(currentDate);
    const WeeksQuaterImgArr = [ 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276 ];
    const WeeksQuaterImgId = WeeksQuaterImgArr[currentWeekInQuarter-1];
   
    const matchingHolidays = holidayDates.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === currentDate.toDateString();
    });


    DSPageData['currentDay'] = currentDay;
    DSPageData['currentMonthDate'] = currentMonthDate;
    DSPageData['WeeksQuaterImgId'] = WeeksQuaterImgId;
    DSPageData['Holidays'] = matchingHolidays;
    


    //left page rendering
    var DailySinglePageLeftHTML ="";
    
    ejs.renderFile(DailySingleTemplate, {Data:DSPageData, ImageArr:ImageArr,  quoteList:quoteList, quoteIndices:quoteIndices}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      DailySinglePageLeftHTML = str;
    });


    return DailySinglePageLeftHTML;
  }

  function getDailyTwoPageHTML(DailyTwoPageTemplate,  DTPageData, ImageArr, currentDate, holidayDates, quoteList, quoteIndices){
   
    const dayOptions = { weekday: 'long' };
    const dateOptions = { month: 'long', day: 'numeric' };
    const currentDay = currentDate.toLocaleDateString('en-US', dayOptions);
    const currentMonthDate = currentDate.toLocaleDateString('en-US', dateOptions);
    
    const currentWeekInQuarter = getWeekQuarter(currentDate);
    const WeeksQuaterImgArr = [ 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276 ];
    const WeeksQuaterImgId = WeeksQuaterImgArr[currentWeekInQuarter-1];

    const matchingHolidays = holidayDates.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === currentDate.toDateString();
    });

    DTPageData['currentDay'] = currentDay;
    DTPageData['currentMonthDate'] = currentMonthDate;
    DTPageData['WeeksQuaterImgId'] = WeeksQuaterImgId;
    DTPageData['Holidays'] = matchingHolidays;


    //left page rendering
    var DailyTwoPageLeftHTML = "";
    DTPageData['Page'] = 'Left';
    ejs.renderFile(DailyTwoPageTemplate, {Data:DTPageData, ImageArr:ImageArr, quoteList:quoteList, quoteIndices:quoteIndices}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      DailyTwoPageLeftHTML = str;
    });
  
    //right page rendering
    var DailyTwoPageRightHTML = "";
    DTPageData['Page'] = 'Right';
   
    ejs.renderFile(DailyTwoPageTemplate, {Data:DTPageData, ImageArr:ImageArr, quoteList:quoteList, quoteIndices:quoteIndices}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      DailyTwoPageRightHTML += str;
    });
    
    return DailyTwoPageLeftHTML+DailyTwoPageRightHTML;
  }

  function calculateWeek (currentDate){
    const MonthOptions = { month: 'long' };

    const currentDayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Calculate the difference to Monday

    const startDate = new Date(currentDate); // Clone today's date
    startDate.setDate(currentDate.getDate() - diff); // Calculate the start date of the week
    const StartCDate = startDate.getDate();
    const StartCMonth = startDate.toLocaleDateString('en-US', MonthOptions);

    // Calculate the end date by adding 6 days to the start date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const EndCDate = endDate.getDate();
    const EndCMonth = endDate.toLocaleDateString('en-US', MonthOptions);

    const MonthLastDate = new Date(startDate);
    MonthLastDate.setMonth(MonthLastDate.getMonth() + 1, 1);
    MonthLastDate.setDate(MonthLastDate.getDate() - 1);

    const Data = [];
    Data['StartDate'] = startDate;
    Data['EndDate'] = endDate;
    Data['StartCMonth'] = StartCMonth;
    Data['StartCDate'] = StartCDate;
    Data['EndCMonth'] = EndCMonth;
    Data['EndCDate'] = EndCDate;
    Data['EndCMonth'] = EndCMonth;
    Data['MonthLastDate'] = MonthLastDate;
    Data['MonthChange'] = StartCMonth!=EndCMonth? 1:0;

    return Data;
  }


  function getWeeklyViewPageHTML(WeeklyViewPageTemplate,  WViewPageData, ImageArr, currentDate, holidayDates, quoteList, quoteIndices){
    const dayOptions1 = { weekday: 'long' };
    
    const nextDayDates = [];
    // Loop to get the next 6 dates
    for (let i = 0; i <= 7; i++) {
      const nextDate = new Date(WViewPageData['StartDate']);
      nextDate.setDate(WViewPageData['StartDate'].getDate() + i);

      const dayName = nextDate.toLocaleDateString('en-US', dayOptions1);
      const dayOfMonth = nextDate.getDate();

      const matchingHolidays = holidayDates.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.toDateString() === nextDate.toDateString();
      });

      nextDayDates.push({dayOfMonth:dayOfMonth, dayName: dayName, HoliDays: matchingHolidays});
    }

  
    WViewPageData['nextDayDates'] = nextDayDates;

    //left page rendering
    var WeeklyViewLeftHTML = "";
    WViewPageData['Page'] = 'Left';
    ejs.renderFile(WeeklyViewPageTemplate, {Data:WViewPageData, ImageArr:ImageArr, quoteList:quoteList, quoteIndices:quoteIndices}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      WeeklyViewLeftHTML = str;
    });

    //right page rendering
    var WeeklyViewRightHTML = "";
    WViewPageData['Page'] = 'Right';
    
    ejs.renderFile(WeeklyViewPageTemplate, {Data:WViewPageData, ImageArr:ImageArr, quoteList:quoteList, quoteIndices:quoteIndices}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      WeeklyViewRightHTML += str;
    });

    return WeeklyViewLeftHTML+WeeklyViewRightHTML;
  }

  function getSimplePageHTML(PageTemplate, ImageArr){
    //console.log("PageTemplate=>",PageTemplate)
    //left page rendering
    var LeftPageHTML = "";
    const PageData = {};
    PageData['Page'] = 'Left';
    ejs.renderFile(PageTemplate, {Data:PageData, ImageArr:ImageArr}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      LeftPageHTML = str;
    });


   //right page rendering
    var RightPageHTML = "";
    PageData['Page'] = 'Right';
    ejs.renderFile(PageTemplate, {Data:PageData, ImageArr:ImageArr}, (err, str) => {
      if (err) {
          console.error('Error rendering EJS template:', err);
          return;
      }
      RightPageHTML = str;
    });

    return LeftPageHTML+RightPageHTML;
  } 

  function getAddinsPlannerHTML(type, AddinsData, AddinsTemplates, templateDir)
  {
    const AddinsPagePath = path.join(__dirname, `../../views/${templateDir}`, `AddinsPage.ejs`);
    //console.log("AddinsPagePath=>",AddinsPagePath)
    var AddinsHTML = "";
    var AddinsArr = [];
    if(AddinsData!==undefined)
    {
        const ReflectionData = AddinsData.Reflection!==undefined ? AddinsData.Reflection.filter(item => item.optType === type):[];
        const HabitsData = AddinsData.Habits!==undefined ? AddinsData.Habits.filter(item => item.optType === type):[];
        const FitnessFoodData = AddinsData.FitnessFood!==undefined ? AddinsData.FitnessFood.filter(item => item.optType === type):[];
        const WorkData = AddinsData.Work!==undefined ? AddinsData.Work.filter(item => item.optType === type):[];
        const FamilyData = AddinsData.Family!==undefined ? AddinsData.Family.filter(item => item.optType === type):[];
        const VisionAndGoalData = AddinsData.VisionAndGoal!==undefined ? AddinsData.VisionAndGoal.filter(item => item.optType === type):[];
        const OthersData = AddinsData.Others!==undefined ? AddinsData.Others.filter(item => item.optType === type):[];
        
        if(type=="Front of Planner"){
          AddinsArr = [...ReflectionData, ...VisionAndGoalData, ...HabitsData, ...WorkData, ...FamilyData, ...FitnessFoodData, ...OthersData];
        }else if(type=="Back of Planner"){
          AddinsArr = [...ReflectionData, ...VisionAndGoalData, ...HabitsData, ...FitnessFoodData, ...WorkData, ...FamilyData, ...OthersData];
        }else{
          AddinsArr = [...ReflectionData, ...VisionAndGoalData, ...HabitsData, ...FitnessFoodData, ...WorkData, ...FamilyData,  ...OthersData];
        }
        
    }

    if(AddinsArr.length>0){
      AddinsArr.map((item)=>{
        for (let i = 0; i < item.count; i++) {
          AddinsHTML += getSimplePageHTML(AddinsPagePath, AddinsTemplates[item.templateId]);
        }
      })
    }
 
    return AddinsHTML;
  }

  function getYearAtGlanceCalendarHTML(type, CalendarData, CalenderTemplates, templateDir )
  {

    const CalendarPagePath = path.join(__dirname, `../../views/${templateDir}`, `CalendarPage.ejs`);
    var CalendarHTML = "";
    var CalendarArr = [];

    if(CalendarData!==undefined && CalendarData!==null)
    {
      CalendarArr = CalendarData.yearlyTemplateSelected!=null ? CalendarData.yearlyTemplateSelected.filter(item => item.optType === type):[];
    }

    if(CalendarArr.length>0){
      CalendarArr.map(async(item)=>{
        for (let i = 0; i < item.count; i++) {
          CalendarHTML += getSimplePageHTML(CalendarPagePath, CalenderTemplates[item.templateId]);
        }
      })
    }

    return CalendarHTML;
  }

  function getMonthlyCalendarHTML(type, CalendarData, CalenderTemplates, currentDate="", DatesData="", HolidayDates="", templateDir )
  {
    var CalendarHTML = "";
    var CalendarArr = [];
    if(CalendarData!==undefined && CalendarData!==null)
    {
       CalendarArr = CalendarData.monthlyTemplateSelected!=null ? CalendarData.monthlyTemplateSelected.filter(item => item.optType === type):[];
    }

    if(CalendarArr.length>0){
      CalendarArr.map(async(item)=>{
        for (let i = 0; i < item.count; i++) {
          if(item.templateId==7){
            CalendarHTML += getMonthlyPageHTML(item.templateId, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir );
          }else if(item.templateId==8){
            CalendarHTML += getMonthlyPageHTML(item.templateId, CalenderTemplates, currentDate, DatesData, HolidayDates, templateDir );
          }
        }
      })
    }
    //console.log("getMonthlyCalendarHTML=>",CalendarHTML)
    return CalendarHTML;
  }
  
  function getExtraMonthlyCalendarHTML(cnt, extraMonths, type,  CalendarData, CalenderTemplates, currentDate="", DatesData="", HolidayDates="", templateDir){
    console.log("getExtraMonthlyCalendarHTML=>",cnt, type, currentDate, extraMonths)
    var CalendarArr = [];
    if(CalendarData!==undefined && CalendarData!==null)
    {
       CalendarArr = CalendarData.monthlyTemplateSelected!==null ? CalendarData.monthlyTemplateSelected.filter(item => item.optType === type):[];
    }


    var Calendar7HTML = "";
    var Calendar8HTML = "";
    const startMonth = new Date(currentDate);
    const nextMonth = new Date(currentDate);
    if(extraMonths=='Monthly') nextMonth.setMonth(nextMonth.getMonth() - 1);
    for (let i = 1; i <= cnt; i++) {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      console.log("nextMonth=>",nextMonth)
      if(CalendarArr.length>0){
        CalendarArr.map(async(item)=>{
          for (let i = 0; i < item.count; i++) {
            if(item.templateId==7){
              Calendar7HTML += getMonthlyPageHTML(item.templateId, CalenderTemplates, nextMonth, DatesData, HolidayDates, templateDir );
            }else if(item.templateId==8){
              Calendar8HTML += getMonthlyPageHTML(item.templateId, CalenderTemplates, nextMonth, DatesData, HolidayDates, templateDir );
            }
          }
        })
      }
     
    }

    return Calendar7HTML+Calendar8HTML;
  }


  function getMonthlyPageHTML(templateId, CalenderTemplates, cDate, DatesData, HolidayDates, templateDir){


    const ImageArr = CalenderTemplates[templateId];

    const calendarData = [];
    const year = cDate.getFullYear();
    const month = cDate.getMonth();
    const monthName = cDate.toLocaleDateString('en-US', { month: 'long' });

    // First date of the month
    const sDate = new Date(year, month, 1);
    const currentDayOfWeek =  sDate.getDay();   // 0 (Sunday) to 6 (Saturday)
    const diff = currentDayOfWeek === 0 ? 5 : currentDayOfWeek ; // Calculate the difference to Monday
    sDate.setDate(sDate.getDate() - diff);
   

    var LeftPageHTML = "";
    var RightPageHTML = "";
    var MonthlyPagePath = path.join(__dirname, `../../views/${templateDir}`, `MonthlyPage_8.ejs`);

    if(templateId==7){
      MonthlyPagePath = path.join(__dirname, `../../views/${templateDir}`, `MonthlyPage_7.ejs`);

      // Calculate the start date of the week
      const StartDayText = DatesData.EventDate.startDayText;
      var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
      if(StartDayText=="Monday Start"){
        daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];
      }
      if(StartDayText=="Monday Start"){
        sDate.setDate(sDate.getDate() +1); // Calculate the start date of the week
      }

      // Last date of the month
      const endDate = new Date(year, month + 1, 0);      
      const currentDate = new Date(sDate);
      while (currentDate <= endDate) 
      {
        
        var matchingHolidays = [];
        if(HolidayDates.length>0){
          matchingHolidays = HolidayDates.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return holidayDate.toDateString() === currentDate.toDateString();
          });
        }
        calendarData.push({
        // date: new Date(currentDate),
          day: currentDate.getDate(),
        // month: currentDate.getMonth() + 1,
          //year: currentDate.getFullYear(),
          dayName: getDayName(currentDate),
          HoliDays: matchingHolidays
        });
          
     
        currentDate.setDate(currentDate.getDate() + 1);
      }

      //left page rendering
      ejs.renderFile(MonthlyPagePath, {Page:"Left", BaseUrl:baseUrl, MonthName: monthName, daysOfWeek:daysOfWeek, CalendarData:calendarData, ImageArr:ImageArr}, (err, str) => {
        if (err) {
            console.error('Error rendering EJS template:', err);
            return;
        }
        LeftPageHTML = str;
      });

      //Right page rendering
      ejs.renderFile(MonthlyPagePath, {Page:"Right", BaseUrl:baseUrl, MonthName: monthName, daysOfWeek:daysOfWeek, CalendarData:calendarData, ImageArr:ImageArr}, (err, str) => {
        if (err) {
            console.error('Error rendering EJS template:', err);
            return;
        }
        RightPageHTML = str;
      });
    }else{

      //left page rendering
      ejs.renderFile(MonthlyPagePath, {Page:"Left", BaseUrl:baseUrl, MonthName: monthName, ImageArr:ImageArr}, (err, str) => {
        if (err) {
            console.error('Error rendering EJS template:', err);
            return;
        }
        LeftPageHTML = str;
      });

      //Right page rendering
      ejs.renderFile(MonthlyPagePath, {Page:"Right", BaseUrl:baseUrl, MonthName: monthName, ImageArr:ImageArr}, (err, str) => {
        if (err) {
            console.error('Error rendering EJS template:', err);
            return;
        }
        RightPageHTML = str;
      });


    }
   
    return LeftPageHTML+RightPageHTML;
  } 

  function getRenwalTemplateHTML(ImageArr, templateDir )
  {
    var RenewalPageHTML ='';
    if(templateDir=="DiaryPages")
    {
      const rewaltemplateId = 320;
      const RenewalPagePath = path.join(__dirname, `../../views/${templateDir}`, `RenewalPage.ejs`);
      RenewalPageHTML = getSimplePageHTML(RenewalPagePath, ImageArr[rewaltemplateId]);
    }
    return RenewalPageHTML;
  }


  function getDayName(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
  }

  function getQuarter(d) {
    d = d || new Date();
    var m = Math.ceil((d.getMonth()+1) / 3);
    m = m>4? m - 4 : m
    return m;
  }
  function getWeekQuarter(d) {
    const weekDays =  Math.floor((d - new Date(d.getFullYear(), 0, 1))/(24 * 60 * 60 * 1000))+1;
    var qtr = getQuarter(d);
    const WeekInYears = Math.ceil(weekDays / 7);
    const WeekInQuarter =  WeekInYears - ((qtr-1)*13);
    const FinalWeekInQuarter =  WeekInQuarter>13 ? 13:WeekInQuarter>0? WeekInQuarter:1;
    //console.log(d,weekDays, qtr, WeekInYears, WeekInQuarter,"=>",FinalWeekInQuarter)
    return  FinalWeekInQuarter;
  }