const HomePage = require("../../../models/homePage-model");


// get all home page data
const allHomePageController = async(req,res)=>{
    try{
        const homePageData = await HomePage.find();
         if (!homePageData)
           return res.status(404).json(
        {
          success: false,
          message: "Home page data not found"
         });

        res.status(200).json({
        status:true,
        count: homePageData.length,
        message:"Get all home page data successfully",
        homePageData:homePageData
    });


    }catch(err){
        res.status(500).json({
            status:false,
            error:err.message
        });
    }
};

module.exports = {
    allHomePageController
};  