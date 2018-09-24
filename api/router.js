const express = require('express');
const router = express.Router();
const chrome = require('./seleTest2');
const sleep = require('sleep');

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
    .then(title => {
        if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ){
            console.log("两步验证，需要协助登陆" , title);
            return title;
        }
        console.log("登陆成功" , title);
        chrome.getHomeInf();
        //chrome.getOderInf();
        setTimeout(()=>{chrome.getOderInf()},10000);

    })
    .catch(err => { console.log("登陆错误" , err); });

router.get('/test',(req,res) => {
    chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
        .then(title => {
            if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0){
                console.log("两步验证，需要协助登陆" , title);
                return title;
            }

            console.log("登陆成功" , title);
        })
        .catch(err => { console.log("登陆错误" , err); });
    res.send("testing");
});

router.get('/q',(req,res) => {
    chrome.quit();
});

router.get('/check',(req,res) => {
    res.send(chrome.accountInf());
});

router.get('/order',(req,res) => {
    chrome.getOderInf();
    res.send("check please");
});

module.exports = router;