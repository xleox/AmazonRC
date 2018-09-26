const sleep = require('sleep');
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const chrome = require('selenium-webdriver/chrome');
const Promise = require("bluebird");
const moment = require("moment");
let driver;

let accountInf={
    版本:{
        编号:"2.0.0.1",
        名称:"月亮"
    },
    首页信息:{
        名称:{xpath:'//*[@id="sc-mkt-switcher-form"]/div',值:""},
        等待中:{xpath:'.//div[text()="等待中"]/../div/span',值:""},
        未发货先配送:{xpath:'.//div[text()="未发货的优先配送订单"]/../div/span',值:""},
        未发货:{xpath:'.//div[text()="未发货"]/../div/span',值:""},
        退货请求:{xpath:'.//div[text()="退货请求"]/../div/span',值:""},
        产品数量:{xpath:'//*[@id="lisitngCount"]',值:""},
        订单数量:{xpath:'//*[@id="OrderSummary"]/div/div[1]/div/div/div/div[2]',值:""},
        买家消息:{xpath:'//*[@id="bsm-record-metrics"]/span/span/a/div[1]/span',值:""},
        超过24小时:{xpath:'//*[@id="widget-fti8vf"]/div/div[2]/div[3]/span[2]/span/a',值:""},
        AtoZ:{xpath:'//*[@id="widget-fti8vf"]/div/div[2]/div[1]/span[1]/span/a/div[1]/span',值:""},
        信用卡拒付:{xpath:'//*[@id="widget-fti8vf"]/div/div[2]/div[1]/span[2]/span/a/div[1]/span',值:""},
        最近付款:{xpath:'//*[@id="fundTransferInfo"]/div/div[1]/div[2]/span/span/a/span',值:""},
        付款信息:{xpath:'//*[@id="fundTransferInfo"]/div/div[2]',值:""},
        通知:{xpath:'//*[@id="sc-snes-number"]',值:""},
        其他通知:{xpath:'//*[@id="widget-glKEIi"]/div/div/p/strong',值:""},
        余额:{xpath:'//*[@id="seller-payments-widget"]/div[1]/div/div/div[last()]/div/div/div/div[2]/span/span/a/span',值:""},
        销售额今天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[2]/td[1]/span',值:""},
        销售额7天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[3]/td[1]/span',值:""},
        销售额15天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[4]/td[1]/span',值:""},
        销售额30天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[5]/td[1]/span',值:""},
        件数今天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[2]/td[2]/span',值:""},
        件数7天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[3]/td[2]/span',值:""},
        件数15天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[4]/td[2]/span',值:""},
        件数30天:{xpath:'//*[@id="sales-summary-table"]/tbody/tr[5]/td[2]/span',值:""}
    },
    首页面板:{
        "未发货订单":{xpath:'//*[@id="OrderSummary"]/div/div[1]/div/div/div/div[2]',值:""},
        "买家消息":{xpath:'//*[@id="BuyerSellerMessaging"]/div/div[1]/div/div/div/div[2]',值:""},
        "七天营业额":{xpath:'//*[@id="Sales"]/div/div[1]/div/div/div/div[2]',值:""}
    },
    订单页面:{
        "数量":{xpath:'//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]',值:"-1"},
        "详情":[]
    },
    更新时间:{
        首页信息:"",
        首页面板:"",
        订单页面:""
    }
};

exports.amazonLogin = function (username,password) {
    //var driver = new webdriver.Builder().forBrowser('chrome').build();
    var options = new chrome.Options();
    options.addArguments("user-data-dir=D:\\Chrome\\User Data\\");
    //options.addArguments("user-data-dir=C:\\Users\\xleox-win10\\AppData\\Local\\Google\\Chrome\\User Data\\");
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build();
    driver.manage().window().maximize();
    driver.get('http://sellercentral.amazon.com/gp/homepage.html');

    return driver.wait(()=> {
        return driver.getTitle()
            .then( title => {  //等待进入界面
                //console.log(title.indexOf("亚马逊"));
                if(title.indexOf("Amazon") >= 0 || title.indexOf("亚马逊") >= 0 ) return title;
                else return false;
            } );}, 60000)
            .then( title =>{
                if(title.indexOf("登录") >= 0 || title.indexOf("Sign") >= 0 ){
                    console.log("进入登陆界面");
                    var xpaths={用户名:'//*[@id="ap_email"]',
                                密码:'//*[@id="ap_password"]',
                                记住框:'//*[@id="authportal-main-section"]/div[2]/div/div/form/div/div/div/div[3]/div/div/label/div/label/input',
                                登陆按钮:'//*[@id="signInSubmit"]',
                                选择账户:'//*[@id="ap-account-switcher-container"]/div[1]/div/div/div[2]/div[1]/div[2]/a/div/div[2]/div/div/div[2]'};
                    sleep.msleep(1*1000); //实际用时延长
                    driver.findElements( By.xpath(xpaths.选择账户))
                        .then(doc => {if(doc.length != 0) driver.findElement(By.xpath(xpaths.选择账户)).click();});

                    driver.wait(until.elementLocated(By.xpath(xpaths.登陆按钮)), 60*1000)
                        .then(()=>{
                            driver.findElements( By.name("rememberMe"))
                                .then(doc => {if(doc.length != 0)
                                    driver.findElement(By.name("rememberMe")).isSelected()
                                        .then( checked=>{if(!checked) driver.findElement(By.name("rememberMe")).click();
                                        });
                                });
                            Promise.all(inputTxtByXpath(xpaths.用户名,username),inputTxtByXpath(xpaths.密码,password))
                                .finally(()=>{
                                    driver.findElement(By.xpath(xpaths.登陆按钮)).click();
                                })
                        });
                    }
                return driver.wait(()=> {
                    return driver.getTitle()
                        .then( title => {  //等待进入界面
                            //if(title.indexOf("主页") >= 0 || title.indexOf("Home") >= 0 || title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 )
                            if(title.indexOf("登录") == -1 && title.indexOf("Sign") == -1)
                                return title;
                            else return false;
                        } );}, 90*1000)
            });
    }
exports.getHomeInf = function () {
    var keys=[];
    for(var key in accountInf.首页信息){
        //accountInf.首页信息[key]['值']='loading';
        //keys.push(key);
        keys.push(setTxt2Inf(accountInf.首页信息,key));
    }
    Promise.all(keys).finally(
            ()=>{accountInf.更新时间.首页信息=moment().format('YYYY-MM-DD HH:mm:ss');});
    //Promise.mapSeries(keys,item=>{setTxt2Inf(accountInf.首页信息,item)});


    keys=[];
    for(var key in accountInf.首页面板){
        //accountInf.首页面板[key]['值']='loading';
        //keys.push(key);
        keys.push(setTxt2Inf(accountInf.首页面板,key));
    }
    Promise.all(keys).finally(
            ()=>{accountInf.更新时间.首页面板=moment().format('YYYY-MM-DD HH:mm:ss');});
    //Promise.mapSeries(keys,item=>{setTxt2Inf(accountInf.首页面板,item)});
    //return new Promise(function(resolve, reject){resolve("获取首页信息完成");});
}
exports.getOderInf = function () {
    driver.manage().window().maximize();
    driver.get('https://sellercentral.amazon.com/orders-v3?ref_=ag_myo_dnav_xx_&_encoding=UTF8');

    return driver.getTitle()
        .then( title => {  //等待进入界面
            if(title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
            else return false;
        } , 60000).then(title => {
            console.log('进入订单管理页面');
            var xpaths={
                进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a'};
            driver.findElements( By.xpath(xpaths.进入新版本))
                .then(doc => {if(doc.length != 0) driver.findElement(By.xpath(xpaths.进入新版本)).click();});

            driver.wait(until.elementLocated(By.xpath(accountInf.订单页面.数量.xpath)), 10*1000)
                .then(()=>{
                    getElementTextByXpath(accountInf.订单页面.数量.xpath)
                        .then(txt=>{
                            orderNum=txt.replace(" 个订单","");
                            console.log("订单数量",orderNum);
                            if(isNaN(orderNum)){
                                accountInf.订单页面.数量.值=-1;
                                return new Promise(function(resolve, reject){reject("订单数量获取失败");});
                            }else {
                                accountInf.订单页面.数量.值=parseInt(orderNum);
                                if(accountInf.订单页面.数量.值==0){
                                    accountInf.订单页面.详情=[];
                                    accountInf.更新时间.订单页面=moment().format('YYYY-MM-DD HH:mm:ss');
                                }else if(accountInf.订单页面.数量.值>0){
                                    var orderNum=[];
                                    for(var i=1;i<=accountInf.订单页面.数量.值 && i<=50;i++){
                                        accountInf.订单页面.详情[i-1]={
                                            日期1:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[2]/div/div[1]/div',值:""},
                                            日期2:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[2]/div/div[2]/div',值:""},
                                            日期3:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[2]/div/div[3]/div',值:""},
                                            订单编号:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[3]/div/div[1]/a',值:""},
                                            买家姓名:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[3]/div/div[2]/div/a',值:""},
                                            销售渠道:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[3]/div/div[4]',值:""},
                                            商品名称:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[5]/div/div/div[1]/div/a',值:""},
                                            商品图片:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[4]/div/img',值:""},
                                            ASIN:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[5]/div/div/div[2]/div/b',值:""},
                                            SKU:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[5]/div/div/div[3]/div',值:""},
                                            数量:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[5]/div/div/div[4]/div/b',值:""},
                                            金额:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[5]/div/div/div[5]/div',值:""},
                                            订单状态:{xpath:'//*[@id="orders-table"]/tbody/tr['+i+']/td[7]/div/div[1]/div/div/span/span',值:""}
                                        };
                                        orderNum.push(i-1);
                                    }
                                    //console.log(JSON.stringify(accountInf.订单页面.详情));
                                    Promise.mapSeries(orderNum,tableTr=>{getTableByTr(tableTr)});
                                    accountInf.更新时间.订单页面=moment().format('YYYY-MM-DD HH:mm:ss');
                                }
                            }
                        });
                });
        })
}
exports.quit=function () {
    driver.close();
}
/**
 * 把数据写入到JSON里
 * @param infJson 根JSON
 * @param name JSON的key
 * @param xpath 读取的路径
 * @returns {*|PromiseLike<T>|Promise<T>}
 */
let setTxt2Inf = function (infJson, name) {
    if(name == '产品图片'){
        return getElementSrcByXpath(infJson[name]['xpath'])
            .then(txt=>{
                console.log(name,txt);
                infJson[name]['值']=txt;
                return name;
            });
    }else
        return getElementTextByXpath(infJson[name]['xpath'])
            .then(txt=>{
                console.log(name,txt);
                infJson[name]['值']=txt;
                return name;
            });
    }
/**
 * 从xpath获取txt文本
 * @param xpath
 * @returns {Promise<Array<WebElement>>}
 */
let getElementTextByXpath = function (xpath) {
    return driver.findElements( By.xpath(xpath) )
            .then(doc => {
                if (doc.length != 0)
                    return driver.findElement(By.xpath(xpath))
                        .getText().then(txt => {return txt;});
                else
                    return 'unknown';
            });
    }
let getElementSrcByXpath = function (xpath) {
    return driver.findElements( By.xpath(xpath) )
        .then(doc => {
            if (doc.length != 0)
                return driver.findElement(By.xpath(xpath))
                    .getAttribute("src").then(txt => {return txt;});
            else
                return 'unknown';
        });
}
/**
 * 从xpath获取txt文本
 * @param xpath
 * @returns {Promise<Array<WebElement>>}
 */
let getTableByTr = function (trInt) {
    var keys=[];
    for(var key in accountInf.订单页面.详情[trInt]){
        //accountInf.订单页面.详情[trInt][key]['值']='loading';
        keys.push(key);
    }
    return Promise.mapSeries(keys,item=>{setTxt2Inf(accountInf.订单页面.详情[trInt],item)});
}
/**
 * 输入input
 * @param xpath
 * @returns {Promise<Array<WebElement>>}
 */
let inputTxtByXpath = function (xpath,v) {
    return driver.findElements( By.xpath(xpath) )
        .then(doc => {
            if (doc.length != 0)
                return driver.findElement(By.xpath(xpath)).getAttribute("value")
                    .then(value=>{
                        if(value == "")
                            return driver.findElement(By.xpath(xpath)).sendKeys(v);
                        else
                            return "";
                    });
            else
                return '';
        });
    }

exports.accountInf=function () {
    return accountInf;
}