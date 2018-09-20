const express = require('express');
const router = express.Router();
const chrome = require('./seleTest2');

const severInf = [];

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
    .then(ret => { console.log("登陆成功" , ret);})
    .catch(err => { console.log("登陆错误" , err); });

router.get('/test',(req,res) => {
    //chrome.getHomeInf("xleox@vip.qq.com","asdf1234X");
    res.send("testing");
});

module.exports = router;