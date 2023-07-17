const express = require("express")
const ipRouter = express.Router()
const axios = require("axios");
const { redis } = require("./user.route");
const { validate } = require("../middleware/validate");


ipRouter.get("/getlocation",validate,async(req,res)=>{
    try{
        const {ip} = req.query;
        const existedData = await redis.get(`${ip}`);
        if(existedData){
            return res.status(200).send({data:JSON.parse(existedData)});
        } 
        const {data} = await axios.get(`GET https://ipapi.co/${req.query.ip}/json/`);
        await redis.set(`${ip}`,JSON.stringify(data),"EX",60*60*5)
        res.status(200).send({data})
    }catch(err){
       winstonLogger.error(err.message);
       res.status(400).send({msg:err.message}) 
    }
})



module.exports ={
    ipRouter
}