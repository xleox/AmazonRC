const express = require('express');
const router = express.Router();
const chrome = require('./seleSaveAndControl');
const moment = require('moment');
const http = require('http');
const fs = require('fs');
const Promise = require("bluebird");
const fsPromise=Promise.promisifyAll(require('fs'));
const config = require('./setting').config;
const 版本={
    代号:'2.0.6.0',
    名称:'牛刀'
}
const sleep = require('sleep');
let RcState="";
let RcBusy=false;

let deliverMission={
    url:"",
    items:[]
};
let uploadMission={
    amzUrl:'https://sellercentral.amazon.com/listing/upload?ref_=xx_upload_tnav_status&language=zh_CN&languageSwitched=1',
    listingUrl:'http://127.0.0.1:666/homeAndOrderPage.txt'
};
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
let addDeliverMission = function (orderID, trackID) {
    for(var i=0;i<deliverMission.items.length;i++){
        if(deliverMission.items[i].orderID == orderID){
            deliverMission.items[i].trackID = trackID;
            return "该订单已存在，并修改";
        }
    }
    deliverMission.items.push({orderID:orderID,trackID:trackID});
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
router.post('/addUploadMission',(req,res)=>{
    //console.log(req.body);
    if(req.body.amzUrl == undefined || req.body.listingUrl == undefined)
    {
        res.send('格式错误');
        return;
    }
    if(req.body.amzUrl == '' || req.body.listingUrl == '')
    {
        res.send('格式错误');
        return;
    }
    uploadMission.amzUrl=req.body.amzUrl;
    uploadMission.listingUrl=req.body.listingUrl;
    res.send('ok');
});
router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});
router.get('/readMission',(req,res)=>{
    res.send(readMission);
});
var getBaseInf = function () {
    if(RcBusy)return;
    RcBusy=true;
    setTimeout(()=>{chrome.quit();RcBusy=false;RcState="空闲";},140*1000);
    RcState="正在打开页面";
    chrome.amazonLogin(config.账户,config.密码)
        .then(title => {
            if(title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ){
                RcState="两步验证，需要协助登陆";
                console.log("两步验证，需要协助登陆" , title);
                return title;
            }
            RcState="登陆成功";
            console.log("登陆成功" , title);
            sleep.msleep(5*1000);
            chrome.getHomePageHtml().then(homeHtml=>{
                RcState="读取首页信息";
                return new Promise(function(resolve, reject){resolve(homeHtml);});
            }).then(homeHtml=>{
                chrome.getOrderPageHtml().then(Orderhtml=>{
                    RcState="读取未发货信息";
                    return new Promise(function(resolve, reject){resolve(homeHtml + Orderhtml);});
                }).then(homeOrderHtml=>{
                    chrome.getOrderCancelPageHtml().then(Cancelhtml=>{
                        RcState="读取已取消信息";
                        return new Promise(function(resolve, reject){resolve(homeOrderHtml + Cancelhtml);});
                    }).then(homeOrderCancelHtml=>{
                    chrome.getOrderShippedPageHtml().then(ShipedOrderhtml=> {
                        var t='<chinaTime>'+moment().format('YYYY-MM-DD HH:mm:ss')+'</chinaTime>';
                        var v='<verNumber>'+版本.代号+'</verNumber>';
                        var n='<verName>'+版本.名称+'</verName>';
                        fs.writeFileSync("./public/homeAndOrderPage.txt",homeOrderCancelHtml + ShipedOrderhtml + t + v + n);
                        RcState="读取已订单信息并保存";
                        if(readMission.length>0)
                        readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(ret=>{
                            RcState="完成第一个读取任务";
                            readMission.splice(0,1);
                            if(readMission.length>0)
                            return readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(ret=>{
                                RcState="完成第二个读取任务";
                                readMission.splice(0,1);
                                if(readMission.length>0)
                                return readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(
                                    ret=>{readMission.splice(0,1);RcState="完成第三个读取任务";
                                });
                            });

                    });
                    });
                })
            });
        })
        .catch(err => {
            chrome.quit();
            console.log("登陆错误" , err);
            RcState="登陆错误";
            RcBusy=false;
        });
    });
}

//getBaseInf();  //启动先打开。。。。。。。。。。
setInterval(()=>{getBaseInf()},600*1000);
setInterval(()=>{sendItems()},30*1000);

var sendItems=function () {
    if(RcBusy)return;
    if(deliverMission.items.length == 0)return;
    RcBusy=true;
    setTimeout(()=>{chrome.quit();RcBusy=false;RcState="空闲";},90*1000);

    var orderIDs = "";
    var items=deliverMission.items;
    for(var i=0;i<items.length;i++)
        orderIDs = orderIDs +  items[i].orderID + ";";
    var sendItemsUrl = deliverMission.url + orderIDs;

    RcState="正在打开页面(发货)";
    chrome.amazonLogin(config.账户,config.密码)
        .then(title => {
            if (title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0) {
                RcState = "两步验证，需要协助登陆";
                console.log("两步验证，需要协助登陆", title);
                return title;
            }
            RcState = "登陆成功(发货)";
            console.log("登陆成功(发货)", title);
            chrome.sendItems(sendItemsUrl,items);
            deliverMission.items=[];
        });

}
var uploadListing=function () {
    if(RcBusy)return;
    if(uploadMission.amzUrl == '' || uploadMission.listingUrl == '' )return;
    RcBusy=true;
    setTimeout(()=>{chrome.quit();RcBusy=false;RcState="空闲";},100*1000);

    /**
     * 下载文件
     * 。。。。
     */
    //console.log(moment().format("YYYY-MM-DD_hh-mm-ss"));
    var listingName=moment().format("YYYY-MM-DD_hh-mm-ss")+".xls";
    var listingPath=__dirname.replace('api','public\\'+listingName);
    RcState="开始下载listing(上传产品)";
    download(uploadMission.listingUrl,"./public/"+listingName,(function (ret) {
        if(ret)
        {
            console.log(listingPath);
            RcState="正在打开页面(上传产品)";
            chrome.amazonLogin(config.账户,config.密码)
                .then(title => {
                    if (title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0) {
                        RcState = "两步验证，需要协助登陆";
                        console.log("两步验证，需要协助登陆", title);
                        return title;
                    }
                    RcState = "登陆成功(上传产品)";
                    console.log("登陆成功(上传产品)", title);
                    chrome.uploadListing(uploadMission.amzUrl,listingPath);
                    uploadMission.listingUrl='';
                });
        }
    }))
}
router.get('/quit',(req,res) => {
    chrome.quit();
    res.send("quit");
});
router.get('/upload',(req,res) => {
    uploadListing();
    res.send("uploadListing");
});
router.get('/order',(req,res) => {
    chrome.getOderInf();
    res.send("check please");
});
router.post('/sendItem',(req,res) => {
    //console.log(req.body.url);
    //console.log(req.body.items);
    if(req.body.url != undefined && req.body.items != undefined){
        deliverMission.url=req.body.url;
        var items = JSON.parse(req.body.items);

        for(var i=0;i<items.length;i++)
            addDeliverMission(items[i].orderID,items[i].trackID);
        res.send("ok");
    }else
        res.send("check please");
});
router.get('/state',(req,res) => {
    res.send({"busy":RcBusy,"state":RcState,"delivery":deliverMission,"readMission":readMission ,'uploadMission':uploadMission});
});
function download (url, dest, cb) {
    var file = fs.createWriteStream(dest);
    http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                cb(true);  // close() is async, call cb after close completes.
            });
        }).on('error', function(err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            cb(false);
        });
    };
module.exports = router;
