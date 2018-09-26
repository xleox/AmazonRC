const express = require('express');
const router = express.Router();
const chrome = require('./seleTest');
const sleep = require('sleep');

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

var getBaseInf = function () {
    chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
        .then(title => {
            if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ){
                console.log("两步验证，需要协助登陆" , title);
                return title;
            }
            console.log("登陆成功" , title);
            chrome.getHomeInf();
            setTimeout(()=>{chrome.getOderInf()},10*1000);
            setTimeout(()=>{chrome.close()},90*1000);
        })
        .catch(err => {
            chrome.quit();
            console.log("登陆错误" , err);
        });
};
getBaseInf();
setInterval(()=>{getBaseInf()},600*1000)


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