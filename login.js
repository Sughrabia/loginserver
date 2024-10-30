const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = 10000;
const server = express();

server.get('/', (request,response)=>{
    response.send("Login Server")
})

server.get('/register', async (request,response)=>{
    const {name, email, password} = request.query
    let url = `http://192.168.18.136:8000/read?email=${email}`
    let result = await axios.get(url); 
    if (result.data) return  response.send("User Already Registered")  
    else {
        let hashPwd = await bcrypt.hash(password, 8);
        url = `http://192.168.18.136:8000/create?name=${name}&email=${email}&password=${hashPwd}`
        result = await axios.get(url);
        return response.send(result.data)
    }
    response.send("Register User")
})

server.get('/login', async (request,response)=>{
    const {email, password} = request.query
    let url = `http://192.168.18.136:8000/read?email=${email}`
    let result = await axios.get(url); 
    if (!result.data) return  response.send("User Not Registered")  
    else {
        let validUser = await bcrypt.compare(password,result.data.password);
        if (validUser){
            let token = jwt.sign({email: email}, "My Key",
                                 {expiresIn : '1h'})
            return response.send({token: token})
        }
        else return response.send("Invalid Password")
    }
    response.send("Register User")
})

function chkUser(request, response, next){
    let head = request.headers.authorization;
    let token = head.split(' ')[1]

    if (token){
        jwt.verify(token, "My Key", (error, user)=>{
            if (error) return response.sendStatus(403)
            else next()
        })

    }
    else return response.sendStatus(403)
}
server.get('/data', chkUser, (request,response)=>{
	response.send("data folder")
})

server.listen(PORT, ()=>{console.log("Server running : ", PORT)});