const express = require("express")
const userRouter = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const Redis = require("ioredis")
const { UserModel } = require("../models/user.model");
const { winstonLogger } = require("../middleware/winston");
require("dotenv").config();
const redis = new Redis();


userRouter.post("/login",async(req,res)=>{
    try{
        const {email,password} = req.body;
        const isUserValid = await UserModel.findOne({email});

        // is user valid
        if(!isUserValid){
            return res.status(400).send({msg:"Please signup"})
        }

        //is password match
        const isPasswordCorrect = bcrypt.compareSync(password,isUserValid.password);
        if(!isPasswordCorrect){
            return res.status(400).send({msg:"Wrong Credentials"})
        }

        //generating token
        const accessToken = jwt.sign(
            {userId:isUserValid._id},
            process.env.JWT_ACCESS_TOKEN_KEY,
            {expiresIn:process.env.JWT_ACCESS_TOKEN_EXP}
        );
        //generating refresh token
        const refreshToken = jwt.sign(
            {userId:isUserValid._id},
            process.env.JWT_REFRESH_TOKEN_KEY,
            {expiresIn:process.env.JWT_REFRESH_TOKEN_EXP}
        );
        await redis.set(
            isUserValid._id + "_access_token",accessToken,"EX",60
        );
        await redis.set(
            isUserValid._id + "_refresh_token",refreshToken,"EX",60*2
            );
        res.cookie("access_token_key",isUserValid._id + "_access_token");
        res.cookie("refresh_token_key",isUserValid._id + "_refresh_token")
        res.status(200).send({msg:"Login Success"});


    }catch(err){
        winstonLogger.error(err.message);
        res.status(400).send({msg:err.message})
    }
})

userRouter.post("/signup",async(req,res)=>{
    try{
        const {email,password} = req.body;
        const isUserPresent = await UserModel.findOne({email})
        // check user is present or not
        if(isUserPresent){
            return res.status(400).send({msg:"Email already present"})
        }
        // hashing the password
        const hashPassword = bcrypt.hashSync(password,7);
        const newUser = new UserModel({...req.body, password: hashPassword});
        await newUser.save();
        res.status(200).send({msg:"Signup successfull",user:newUser})
    }catch(err){
        winstonLogger.error(err.message);
        res.status(400).send({msg:err.message})
    }
})

userRouter.get("/logout",async(req,res)=>{
    try{
        const tokenKey = req?.cookies?.access_token_key;
        const refreshKey = req?.cookies?.refresh_token_key;

        const accessToken = await redis.get(tokenKey);
        const refreshToken = await redis.get(refreshKey);

        await redis.set(accessToken,accessToken,"EX",60*5);
        await redis.set(refreshToken,refreshToken,"EX",60*5);
        await redis.del(tokenKey);
        await redis.del(refreshKey);
        res.status(200).send({msg:"Logout Success"});

    }catch(err){
        winstonLogger.error(err.message);
        res.status(400).send({msg:err.message});
    }
})

userRouter.get("/refreshtoken",async(req,res)=>{
    try{
        const tokenKey = req?.cookies?.refresh_token_key;
        const refreshToken = await redis.get(tokenKey);

        if(!refreshToken){
            return res.status(400).send({msg:"Unauthorised"});
        }
        const isTokenValid = await jwt.verify(
            refreshToken,process.env.JWT_REFRESH_TOKEN_KEY
        );
        if(!isTokenValid){
            return res.status(400).send({msg:"Unauthorised"});
        }
        const accessToken = jwt.sign(
            {userId:isTokenValid.userId},
            process.env.JWT_ACCESS_TOKEN_KEY,
            {expiresIn:process.env.JWT_ACCESS_TOKEN_EXP}
        )
        await redis.set(
            isTokenValid.userId + "_access_token","EX",60
        )
        res.cookie("access_token_key",isTokenValid.userId+"_access_token");
        res.send({message:"Token Generated"});

    }catch(err){
        winstonLogger.error(err.message);
        res.status(400).send({msg:err.message});
    }
})


module.exports = { 
      userRouter,
      redis
}