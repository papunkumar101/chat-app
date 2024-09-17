const express = require('express');
const path = require('path');
const UserController = require("./app.controller");

const app = express();
app.use(express.json());
const port = 3000;


app.get('/', (req, res)=>{
    return res.sendFile(path.join(__dirname, "../Client/welcome.html"));
});
app.get('/signin', (req, res)=>{
    return res.sendFile(path.join(__dirname, "../Client/signin.html"));
});
app.post('/signin', (req, res)=>{
    console.log('req', req.body);
    return res.send('success');
});
app.get('/signup', (req, res)=>{
    return res.sendFile(path.join(__dirname, "../Client/signup.html"));
});
app.post('/signup', UserController.signup);

app.listen(port, ()=>{
    console.log(`server listing on port : ${port}`);
});

