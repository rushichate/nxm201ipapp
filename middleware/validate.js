
const validate = async (req,res,next)=>{
    const {ip} = req.query;
    const regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if(regex.test(ip)){
        next();
    }else{
        res.status(400).send({msg:"Invalid IP"})
    }
}

module.exports ={
    validate
}