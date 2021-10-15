const express = require("express");
const router = express.Router();
const chrome = require("./seleSaveAndControl");
const moment = require("moment");
const http = require("http");
const fs = require("fs");
const sleep = require("sleep");
const Promise = require("bluebird");
const config = require("./setting").config;

const 版本 = { "代号": "2.0.9.3", "名称": "牛刀" }
let RcState = "";
let RcBusy = false;
let merchantId = "";  // 用户在亚马逊的唯一标识之一 可以用来切换店铺
let marketplaceId = "";  // 店铺ID
let amazonHost="amazon.com";
if(config["站点"] !== undefined) amazonHost=config["站点"];
let deliverMission = { url: "", items: [] };
let uploadMission = { amzUrl: "", amzSite: "", listingUrl: "" };
let readMission = [];

// 添加任务
let addReadMission = function (url, saveFile) {
    for (let i = 0; i < readMission.length; i++) {
        if(readMission[i].url === url && readMission[i].saveFile === saveFile) return "任务已在列表中";
    }
    readMission.push({url: url, saveFile: saveFile});
    return "添加成功";
}

let readUrlThenSave = function (url, saveFile) {
    return chrome.getUrlHtml(url).then(html => {
        fs.writeFileSync("./public/" + saveFile + ".txt", html);
        return new Promise(function(resolve, reject){ resolve("done"); });
    });
}
router.post("/addReadMisson",(req,res) => {
    if (req.body.url === undefined || req.body.saveFile === undefined) {
        res.send("格式错误");
        return;
    }
    if (req.body.url === "" || req.body.saveFile === "") {
        res.send("格式错误");
        return;
    }
    res.send(addReadMission(req.body.url, req.body.saveFile));
});
router.post("/addUploadMission",(req,res) => {
    if (req.body.amzUrl === undefined || req.body.listingUrl === undefined) {
        res.send("格式错误");
        return;
    }
    if (req.body.amzUrl === "" || req.body.listingUrl === "") {
        res.send("格式错误");
        return;
    }
    if (req.body.amzSite !== undefined) uploadMission.amzSite = req.body.amzSite;
    else uploadMission.amzSite = "www.amazon.com";
    uploadMission.amzUrl = req.body.amzUrl;
    uploadMission.listingUrl = req.body.listingUrl;
    res.send("ok");
});
router.get("/",(req,res) => {
    res.send("Amazon Control Sever Start");
});
router.get("/readMission",(req,res) => {
    res.send(readMission);
});
let getBaseInf = function () {
    if (RcBusy) return;
    RcBusy = true;
    setTimeout(() => { chrome.quit(); RcBusy = false; RcState = "空闲"; },360 * 1000);
    RcState = "正在打开页面";
    chrome.amazonLogin(config.账户, config.密码).then(title => {
        if (title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ) {
            RcState = "两步验证，需要协助登陆";
            console.log("两步验证，需要协助登陆" , title);
            return title;
        }
        RcState = "登陆成功";
        console.log("登陆成功", title);
        sleep.msleep(6 * 1000);
        chrome.getHomePageHtml().then(homeHtml => {
            RcState = "读取首页信息";
            if (merchantId === "" || merchantId === "-") {
                merchantId = getTextByReg(homeHtml, /(?<=data-merchant_selection="amzn1.merchant.o.)(.*?)(?=")/g, 0);
            }
            marketplaceId = getTextByReg(homeHtml, /(?<="marketplaceId":")(.*?)(?=")/g, 0);
            if (amazonHost === "amazon.com" && marketplaceId !== "ATVPDKIKX0DER") {
                console.log("美国店铺首页不是美国站，正在跳转");
                RcState = "美国店铺首页不是美国站，正在跳转";
                return chrome.getUrlHtml("https://sellercentral.amazon.com/merchant-picker/change-merchant?url=%2Fhome%3Fcor%3Dmmd%5FNA&marketplaceId=ATVPDKIKX0DER&merchantId=" + merchantId);
            }
            if (amazonHost === "amazon.co.uk" && marketplaceId !== "A1F83G8C2ARO7P") {
                console.log("欧洲店铺首页不是英国站，正在跳转");
                RcState = "欧洲店铺首页不是英国站，正在跳转";
                return chrome.getUrlHtml("https://sellercentral.amazon.co.uk/merchant-picker/change-merchant?url=%2Fhome%3Fcor%3Dmmd%5FEU&marketplaceId=A1F83G8C2ARO7P&merchantId=" + merchantId);
            }
            return new Promise(function(resolve, reject){ resolve(homeHtml); });
        }).then(homeHtml => {
            chrome.getOrderPageHtml().then(orderHtml => {
                RcState = "读取未发货信息";
                return new Promise(function(resolve, reject){ resolve(homeHtml + orderHtml); });
            }).then(homeOrderHtml => {
                chrome.getOrderCancelPageHtml().then(cancelHtml => {
                    RcState = "读取已取消信息";
                    return new Promise(function(resolve, reject){ resolve(homeOrderHtml + cancelHtml); });
                }).then(homeOrderCancelHtml => {
                    chrome.getOrderShippedPageHtml().then(shippedOrderHtml => {
                        let t = "<chinaTime>" + moment().format("YYYY-MM-DD HH:mm:ss") + "</chinaTime>";
                        let v = "<verNumber>" + 版本.代号 + "</verNumber>";
                        let n = "<verName>" + 版本.名称 + "</verName>";
                        fs.writeFileSync("./public/homeAndOrderPage.txt",homeOrderCancelHtml + shippedOrderHtml + t + v + n);
                        RcState = "读取已订单信息并保存";
                        if (config["FBA"] && readMission.length === 0) {
                            chrome.getInventoryPageHtml().then(InventoryHtml => {
                                RcState = "读取FBA库存信息";
                                let inventoryStr = InventoryHtml.replace(/\n|\r|\t|\s{2,}/g, "").replace(/<script.*?<\/script>/g, "");
                                let canceledUrl = "https://sellercentral." + amazonHost + "/orders-api/search?limit=500&offset=0&sort=order_date_desc&date-range=last-30&fulfillmentType=fba&orderStatus=canceled&forceOrdersTableRefreshTrigger=false";
                                chrome.getUrlHtml(canceledUrl).then(canceledHtml => {
                                    RcState = "读取FBA已取消订单信息";
                                    let allUrl = "https://sellercentral." + amazonHost + "/orders-api/search?limit=1000&offset=0&sort=order_date_desc&date-range=last-30&fulfillmentType=fba&orderStatus=all&forceOrdersTableRefreshTrigger=false";
                                    chrome.getUrlHtml(allUrl).then(allOrderHtml => {
                                        RcState="读取FBA所有订单信息";
                                        let fbaOrderHtml = "<inventory>" + inventoryStr + "</inventory><allOrder>" + allOrderHtml + "</allOrder><canceledOrder>" + canceledHtml + "</canceledOrder>" + t;
                                        fs.writeFileSync("./public/fbaOrderHtml.txt", fbaOrderHtml);
                                    })
                                })
                            })
                        }
                        if(readMission.length > 0) {
                            readUrlThenSave(readMission[0].url, readMission[0].saveFile).then(ret => {
                                RcState = "完成第一个读取任务";
                                readMission.splice(0,1);
                                if(readMission.length > 0) {
                                    return readUrlThenSave(readMission[0].url, readMission[0].saveFile).then(ret => {
                                        RcState="完成第二个读取任务";
                                        readMission.splice(0,1);
                                        if(readMission.length > 0) {
                                            return readUrlThenSave(readMission[0].url,readMission[0].saveFile).then(ret => {
                                                readMission.splice(0,1);
                                                RcState = "完成第三个读取任务";
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                })
            });
        }).catch(err => { chrome.quit(); console.log("登陆错误" , err); RcState = "登陆错误"; RcBusy = false; });
    });
}
// 启动先打开。。。。。。。。。。
getBaseInf();
setInterval(() => { getBaseInf() }, 15 * 60 * 1000);
setInterval(() => { sendItems() }, 4 * 60 * 1000);
setInterval(() => { uploadListing() }, 35 * 1000);
let sendItems = function () {
    if (RcBusy) return;
    if (deliverMission.items.length === 0) return;
    RcBusy = true;
    setTimeout(()=>{chrome.quit(); RcBusy = false; RcState = "空闲";}, 3 * 60 * 1000);
    let orderIDs = "";
    let nowItems = deliverMission.items;
    let plan2SendItems = [];
    let delItems = function (orderID) {
        for (let i = 0; i < nowItems.length; i++)
            if (nowItems[i].orderID === orderID) { nowItems.splice(i, 1); }
    };
    let initSelectName = deliverMission.items[0].selectName , initCompanyName = deliverMission.items[0].companyName;
    // 把要发货的从系统发货数组里转移到计划里
    for(let i = 0; i < nowItems.length; i++)
        if(nowItems[i].selectName === initSelectName && nowItems[i].companyName === initCompanyName){
            orderIDs = orderIDs +  nowItems[i].orderID + ";";
            plan2SendItems.push(nowItems[i]);
        }
    // 把系统变量里的删除掉
    for(let i = 0; i < plan2SendItems.length; i++) delItems(plan2SendItems[i].orderID);
    let sendItemsUrl = deliverMission.url + orderIDs;
    RcState = "正在打开页面(发货)";
    console.log("发货单号", orderIDs);
    chrome.amazonLogin(config.账户, config.密码).then(title => {
        if (title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0) {
            RcState = "两步验证，需要协助登陆";
            console.log("两步验证，需要协助登陆", title);
            return title;
        }
        RcState = "登陆成功(发货)";
        console.log("登陆成功(发货)", title);
        chrome.sendItems(sendItemsUrl, plan2SendItems);
    });
}
let uploadListing = function () {
    if (RcBusy) return;
    if (uploadMission.amzUrl === "" || uploadMission.listingUrl === "" ) return;
    RcBusy = true;
    setTimeout(() => { chrome.quit(); RcBusy = false; RcState = "空闲"; },150 * 1000);
    let marketID = {
        "www.amazon.com": "ATVPDKIKX0DER",
        "www.amazon.ca": "A2EUQ1WTGCTBG2",
        "www.amazon.com.mx": "A1AM78C64UM0Y8",
        "www.amazon.co.jp": "A1VC38T7YXB528",
        "www.amazon.co.uk": "A1F83G8C2ARO7P",
        "www.amazon.de": "A1PA6795UKMFR9",
        "www.amazon.fr": "A13V1IB3VIYZZH",
        "www.amazon.it": "APJ6JRA9NG5V4",
        "www.amazon.es": "A1RKKUPIHCS9HS",
        "www.amazon.com.au": "A39IBJ37TRP1C6"
    }
    /**
     * 下载文件
     **/
    let listingName = moment().format("YYYY-MM-DD_hh-mm-ss") + ".xls";
    let listingPath = __dirname.replace("api", "public\\" + listingName);
    RcState = "开始下载listing(上传产品)";
    download(uploadMission.listingUrl, "./public/" + listingName, (function (ret) {
        if (ret) {
            console.log('下载listing完成', listingPath);
            RcState = "正在打开页面(上传产品/申请转账)";
            chrome.amazonLogin(config.账户, config.密码).then(title => {
                if (title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0) {
                    RcState = "两步验证，需要协助登陆";
                    console.log("两步验证，需要协助登陆", title);
                    return title;
                }
                RcState = "登陆成功(上传产品/申请转账)";
                console.log("登陆成功(上传产品/申请转账)", title);
                chrome.getHomePageHtml().then(homeHtml => {
                    if(merchantId === "" || merchantId === "-") merchantId = getTextByReg(homeHtml, /(?<=data-merchant_selection="amzn1.merchant.o.)(.*?)(?=")/g, 0);
                    marketplaceId = getTextByReg(homeHtml, /(?<=data-marketplace_selection=")(.*?)(?=")/g, 0);
                    if (marketplaceId !== "-") {
                        if (marketID[uploadMission.amzSite] !== marketplaceId) {
                            if (merchantId !== '-') {
                                return chrome.getUrlHtml('https://sellercentral.' + amazonHost + '/merchant-picker/change-merchant?url=%2Fhome%3Fcor%3Dmmd%5FNA&marketplaceId=' + marketID[uploadMission.amzSite] + '&merchantId=' + merchantId);
                            } else {
                                console.log("merchantId: " + merchantId + " 匹配出错！！！");
                                uploadMission.listingUrl = "";
                                chrome.quit();
                                return merchantId;
                            }
                        } else return new Promise(function(resolve, reject){ resolve('"marketplaceId":"' + marketplaceId + '"'); });
                    } else {
                        console.log("marketplaceID: " + marketplaceId + " 匹配出错！！！");
                        uploadMission.listingUrl = "";
                        chrome.quit();
                        return marketplaceId;
                    }
                }).then((ret) => {
                    if (marketID[uploadMission.amzSite] === getTextByReg(ret, /(?<="marketplaceId":")(.*?)(?=")/g, 0)) { //再次验证 看是否已经跳转
                        if (uploadMission.amzUrl.indexOf('/disburse/submit') === -1) { //判断是否申请转账 还是上传产品
                            RcState = "准备上传(上传产品)";
                            console.log("准备上传(上传产品)", title);
                            chrome.uploadListing(uploadMission.amzUrl, listingPath, uploadMission.amzSite);
                            uploadMission.listingUrl = "";
                        } else {
                            RcState = "申请转账";
                            console.log("申请转账", title);
                            chrome.getUrlHtml(uploadMission.amzUrl).then(html => {
                                let datetime = moment().format("YYYY-MM-DD HH:mm:ss");
                                let withdrawHtml = html.replace(/\t|\n|\r|\s/g, "");
                                withdrawHtml = withdrawHtml.match(/(?<=id="currentBalanceValue"><spanclass="currency.*?">)(.*?)(?=<\/span>)/g);
                                let transferAmount = "";
                                if (withdrawHtml !== null) transferAmount = withdrawHtml[0];
                                else transferAmount = "-";
                                let options = { flag: "a+" };
                                let saveInfo = '{"转账时间": "' + datetime + '", "转账站点": "' + uploadMission.amzSite + '", "转账金额": "' + transferAmount + '"}\n';
                                fs.writeFileSync("./public/withdraw.txt", saveInfo, options);
                                uploadMission.listingUrl = "";
                                return new Promise(function(resolve, reject){ resolve('done'); });
                            });
                        }
                    } else {
                        console.log("marketplaceID: " + marketplaceId + " 匹配出错！！！");
                        chrome.quit();
                        uploadMission.listingUrl = "";
                        return marketplaceId;
                    }
                })
            }).catch(err => {
                chrome.quit();
                console.log("上传产品/申请转账 出错" , err);
                uploadMission.listingUrl='';
            });
        }
    }))
};
router.get("/quit",(req,res) => {
    chrome.quit();
    res.send("quit");
});
router.get("/upload",(req,res) => {
    uploadListing();
    res.send("uploadListing");
});
router.get("/order",(req,res) => {
    chrome.getOderInf();
    res.send("check please");
});
router.get("/send",(req,res) => {
    sendItems();
    res.send("check please");
});
router.post("/sendItem",(req,res) => {
    let isInDeliverMission = function (orderID) {
        for(let i = 0; i < deliverMission.items.length; i++) if (deliverMission.items[i].orderID === orderID) return i;
        return -1;
    };
    if (req.body.url !== undefined && req.body.items !== undefined) {
        deliverMission.url = req.body.url;
        let items = JSON.parse(req.body.items);
        for (let i = 0; i < items.length; i++) {
            if (isInDeliverMission(items[i].orderID) === -1) {
                deliverMission.items.push({
                    orderID: items[i].orderID,
                    trackID: items[i].trackID,
                    selectName: items[i].selectName,
                    companyName: items[i].companyName,
                    serviceSelect: items[i].serviceSelect,
                    serviceContent: items[i].serviceContent,
                });
            } else {
                deliverMission.items[i].trackID = items[i].trackID;
                deliverMission.items[i].selectName = items[i].selectName;
                deliverMission.items[i].companyName = items[i].companyName;
                deliverMission.items[i].serviceSelect = items[i].serviceSelect;
                deliverMission.items[i].serviceContent = items[i].serviceContent;
            }
        }
        res.send("ok");
    } else res.send("check please");
});
router.get("/state",(req,res) => {
    res.send({ "busy": RcBusy, "state": RcState, "delivery": deliverMission, "readMission": readMission ,"uploadMission": uploadMission });
});
function download (url, dest, cb) {
    let file = fs.createWriteStream(dest);
    http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            cb(true);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        cb(false);
    });
}
/**
 * 用正则表达式搜索字符
 * @param text 正文
 * @param reg 正则表达式
 * @param i 第几个
 * @returns {string}
 */
let getTextByReg = function (text, reg, i) {
    let regMatch = text.match(reg);
    if(regMatch !== null)
        if(regMatch[i] !== undefined) return regMatch[i];
    return "-"
};
module.exports = router;
