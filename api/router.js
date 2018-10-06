const express = require('express');
const router = express.Router();
const chrome = require('./seleSaveAndControl');
const moment = require('moment');
const fs = require('fs');
const Promise = require("bluebird");
const config = require('./setting').config;
const 版本={
    代号:'2.0.0.1',
    名称:'牛刀'
}

let readMission=[];
/*readMission=[{
    url:'https://sellercentral.amazon.com/hz/orders/details?_encoding=UTF8&orderId=111-4667144-2665047',
    saveFile:"111-4667144-2665047"
},{
    url:'https://sellercentral.amazon.com/hz/orders/details?_encoding=UTF8&orderId=113-8512576-6713068',
    saveFile:"113-8512576-6713068"
},{
    url:'https://sellercentral.amazon.com/hz/orders/details?_encoding=UTF8&orderId=701-5241496-1581001',
    saveFile:"701-5241496-1581001"
}];*/
let addReadMission = function (url, saveFile) {
    for(var i=0;i<readMission.length;i++){
        if(readMission[i].url == url && readMission[i].saveFile == saveFile)
            return '任务已在列表中';
    }
    readMission.push({url:url,saveFile:saveFile});
    return '添加成功';
}

let readUrlThenSave=function (url,saveFile) {
    return chrome.getUrlHtml(url).then(
        html=>{
            fs.writeFileSync("./public/"+saveFile+".txt",html);
            return new Promise(function(resolve, reject){resolve('done');});
        });
}
router.post('/addReadMisson',(req,res)=>{
    //console.log(req.body);
    if(req.body.url == undefined || req.body.saveFile == undefined)
    {
        res.send('格式错误');
        return;
    }
    if(req.body.url == '' || req.body.saveFile == '')
    {
        res.send('格式错误');
        return;
    }
    res.send(addReadMission(req.body.url,req.body.saveFile));
});
router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});
router.get('/readMission',(req,res)=>{
    res.JSON(readMission);
});
var getBaseInf = function () {
    setTimeout(()=>{chrome.quit()},120*1000);
    chrome.amazonLogin(config.账户,config.密码)
        .then(title => {
            if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ){
                console.log("两步验证，需要协助登陆" , title);
                return title;
            }
            console.log("登陆成功" , title);

            chrome.getHomePageHtml().then(homeHtml=>{
                return new Promise(function(resolve, reject){resolve(homeHtml);});
            }).then(homeHtml=>{
                chrome.getOrderPageHtml().then(Orderhtml=>{
                    //var t='<chinaTime>'+moment().format('YYYY-MM-DD HH:mm:ss')+'</chinaTime>';
                    //fs.writeFileSync("./public/homeAndOrderPage.txt",homeHtml + Orderhtml + t);
                    return new Promise(function(resolve, reject){resolve(homeHtml + Orderhtml);});
                }).then(homeOrderHtml=>{
                    chrome.getOrderShippedPageHtml().then(ShipedOrderhtml=> {
                        var t='<chinaTime>'+moment().format('YYYY-MM-DD HH:mm:ss')+'</chinaTime>';
                        var v='<verNumber>'+版本.代号+'</verNumber>';
                        var n='<verName>'+版本.名称+'</verName>';
                        fs.writeFileSync("./public/homeAndOrderPage.txt",homeOrderHtml + ShipedOrderhtml + t + v + n);

                        if(readMission.length>0)
                        readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(ret=>{
                            readMission.splice(0,1);
                            if(readMission.length>0)
                            return readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(ret=>{
                                readMission.splice(0,1);
                                if(readMission.length>0)
                                return readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(
                                    ret=>{readMission.splice(0,1);
                                });
                            });

                    });
                })
            });
        })
        .catch(err => {
            chrome.quit();
            console.log("登陆错误" , err);
        });
    });
}

getBaseInf();
setInterval(()=>{getBaseInf()},600*1000);

router.get('/test',(req,res) => {
    chrome.amazonLogin(config.账户,config.密码)
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
