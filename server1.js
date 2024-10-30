const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = 12000;
const server = express();


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
	response.send("Server 1")
})

server.listen(PORT, ()=>{console.log("Server running : ", PORT)});