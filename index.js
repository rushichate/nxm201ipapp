const express = require("express")
const app = express()
const cookieParser = require("cookie-parser");
const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { auth } = require("./middleware/auth");
const { ipRouter } = require("./routes/ip.route");
require("dotenv").config()

const port = process.env.port;
app.use(express.json())
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.send("API app home page")
})

app.use("/users",userRouter)
app.use(auth)
app.use("/ip",ipRouter)


app.listen(port,async()=>{
    try{
    await connection
    console.log("connected to db");
    console.log(`Running on ${port}`)
    }catch(err){
        console.log(err.message);
    }
})

