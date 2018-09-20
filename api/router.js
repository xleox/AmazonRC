const express = require('express');
const router = express.Router();
const chrome = require('./seleTest2');
const sleep = require('sleep');

const severInf = [];

let accountInf={
    首页信息:{
        名称:{xpath:"//*[@id=\"sc-mkt-switcher-form\"]/div",值:""},
        国家:{xpath:"",值:""},
        产品数量:{xpath:"//*[@id=\"agsBILWidget\"]/div[1]/div/table/tbody/tr[1]/td[1]/div/div/div/a",值:""},
        订单数量:{xpath:"",值:""},
        买家消息:{xpath:"",值:""},
        退货请求:{xpath:"",值:""},
    }
};

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
    .then(title => {
        if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 || title.indexOf("two") >= 0 ){
            console.log("两步验证，需要协助登陆" , title);
            return title;
        }
        console.log("登陆成功" , title);
        chrome.getHomeInf();
    })
    .catch(err => { console.log("登陆错误" , err); });

router.get('/test',(req,res) => {
    chrome.amazonLogin("xleox@vip.qq.com","asdf1234x")
        .then(title => {
            if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 || title.indexOf("two") >= 0 ){
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

module.exports = router;