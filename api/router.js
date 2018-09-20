const express = require('express');
const router = express.Router();
const chrome = require('./seleTest2');

const severInf = [];

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

chrome.getHomeInf("xleox@vip.qq.com","asdf1234X");

router.get('/test',(req,res) => {
    //chrome.getHomeInf("xleox@vip.qq.com","asdf1234X");
    res.send("testing");
});

module.exports = router;