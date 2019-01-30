const sleep = require('sleep');
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const chrome = require('selenium-webdriver/chrome');
const Promise = require("bluebird");
const moment = require("moment");
const config = require('./setting').config;

let driver;
let amazonHost="amazon.com";
if(config.站点 != undefined)
    amazonHost=config.站点;

exports.amazonLogin = function (username,password) {
    var options = new chrome.Options();
    if(amazonHost=="amazon.com")
        options.addArguments("user-data-dir=C:\\Chrome\\User Data\\");
    else
        options.addArguments("user-data-dir=C:\\Chrome\\"+amazonHost+"\\");
    //options.addArguments("user-data-dir=C:\\Users\\xleox-win10\\AppData\\Local\\Google\\Chrome\\User Data\\");
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build();
    driver.manage().window().maximize();
    driver.get('http://sellercentral.'+amazonHost+'/gp/homepage.html');

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
                    sleep.msleep(10*1000); //实际用时延长
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
                            sleep.msleep(2*1000); //实际用时延长
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
                        } );}, 120*1000)
            });
    }
exports.getHomePageHtml = function () {
    return driver.getPageSource();
}
exports.getOrderPageHtml = function () {
    driver.manage().window().maximize();
    //driver.get('https://sellercentral.amazon.com/orders-v3?ref_=ag_myo_dnav_xx_&_encoding=UTF8');
    //driver.get('https://sellercentral.amazon.com/orders-v3/mfn/shipped?ref_=xx_myo_dnav_home&_encoding=UTF8&date-range=last-365&page=1');
    driver.get('https://sellercentral.'+amazonHost+'/orders-v3/mfn/unshipped?ref_=xx_myo_dnav_home&_encoding=UTF8&page=1&date-range=last-14');
    return driver.getTitle()
        .then( title => {  //等待进入界面
            if(title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
            else return false;
        } , 60000).then(title => {
            console.log('订单管理-未发货');
            var xpaths={
                进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a'};
            driver.findElements( By.xpath(xpaths.进入新版本))
                .then(doc => {if(doc.length != 0) driver.findElement(By.xpath(xpaths.进入新版本)).click();});

            //查看订单数量
            return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10*1000)
                .then(()=>{
                    sleep.msleep(10*1000);
                    return driver.getPageSource();
                });
        });
}
exports.getOrderShippedPageHtml = function () {
    driver.manage().window().maximize();
    //driver.get('https://sellercentral.amazon.com/orders-v3?ref_=ag_myo_dnav_xx_&_encoding=UTF8');
    driver.get('https://sellercentral.'+amazonHost+'/orders-v3/mfn/shipped?ref_=xx_myo_dnav_xx&_encoding=UTF8&date-range=last-14&page=1');
    return driver.getTitle()
        .then( title => {  //等待进入界面
            if(title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
            else return false;
        } , 60000).then(title => {
            console.log('订单管理-已发货');
            var xpaths={
                进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a'};
            driver.findElements( By.xpath(xpaths.进入新版本))
                .then(doc => {if(doc.length != 0) driver.findElement(By.xpath(xpaths.进入新版本)).click();});

            //查看订单数量
            return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10*1000)
                .then(()=>{
                    sleep.msleep(10*1000);
                    return driver.getPageSource();
                });
        });
}
exports.getOrderCancelPageHtml = function () {
    driver.manage().window().maximize();
    //driver.get('https://sellercentral.amazon.com/orders-v3?ref_=ag_myo_dnav_xx_&_encoding=UTF8');
    driver.get('https://sellercentral.'+amazonHost+'/orders-v3/mfn/canceled?ref_=xx_myo_dnav_xx&_encoding=UTF8&shipByDate=all&page=1&date-range=last-14');
    return driver.getTitle()
        .then( title => {  //等待进入界面
            if(title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
            else return false;
        } , 60000).then(title => {
            console.log('订单管理-已取消');
            var xpaths={
                进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a'};
            driver.findElements( By.xpath(xpaths.进入新版本))
                .then(doc => {if(doc.length != 0) driver.findElement(By.xpath(xpaths.进入新版本)).click();});

            //查看订单数量
            return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10*1000)
                .then(()=>{
                    sleep.msleep(10*1000);
                    return driver.getPageSource();
                });
        });
}
exports.sendItems = function (url, trackIDs) {
    driver.get(url);
    return driver.wait(()=> {
        return driver.getTitle()
            .then( title => {  //等待进入界面
                //console.log(title.indexOf("亚马逊"));
                if(title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
                else return false;
            } );}, 60000).then(title => {
                console.log("准备发货");
                sleep.msleep(8*1000);
                driver.findElement(By.xpath('//*[@id="carrierNameDropDown_UNSHIPPEDITEMS"]')).click();
                sleep.msleep(2*1000);
                if(trackIDs[0].selectName != "其他")
                    driver.findElement(By.xpath('//*[@id="carrierNameDropDown_UNSHIPPEDITEMS"]/option[@value="'+trackIDs[0].selectName+'"]')).click();
                else{
                    driver.findElement(By.xpath('//*[@id="carrierNameDropDown_UNSHIPPEDITEMS"]/option[@value="Other"]')).click();
                    sleep.msleep(2*1000);
                    driver.findElement(By.xpath('//input[@id="carrierName_UNSHIPPEDITEMS"]')).clear();
                    sleep.msleep(2*1000);
                    inputTxtByXpath('//input[@id="carrierName_UNSHIPPEDITEMS"]',trackIDs[0].selectName)
                    //driver.findElement(By.xpath('//input[@id="carrierName_UNSHIPPEDITEMS"]')).setAttribute("value", trackIDs[0].selectName);
                }
                sleep.msleep(2*1000);
                let sendMission = [];
                for(var i=0;i<trackIDs.length;i++){
                    sendMission.push(inputTxtByXpath('//*[@id="trackingID_'+trackIDs[i].orderID+'"]',trackIDs[i].trackID))
                }
            Promise.all(sendMission)
                .finally(()=>{
                    ////////driver.findElement(By.xpath('//*[@id="myo-cms-confirm"]/span')).click();
                })
        })
}
exports.uploadListing = function (url, filePath) {
    driver.get(url);
    return driver.wait(()=> {
        return driver.getTitle()
            .then( title => {  //等待进入界面
                if(title.indexOf("Upload") >= 0 || title.indexOf("上传商品") >= 0 ) return title;
                else return false;
            } );}, 60000).then(title => {
        console.log("准备上传");
        driver.findElement(By.xpath('//*[@id="a-autoid-4-announce"]/span')).click();
        sleep.msleep(3*1000);
        driver.findElement(By.xpath('//*[@id="dropdown1_0"]')).click();
        sleep.msleep(2*1000);
        driver.findElement(By.xpath('//*[@id="reportOutputColumn"]/span/div[1]/label/i')).click();
        inputTxtByXpath('//*[@id="upload-form"]/table[1]/tbody/tr[3]/td/span/input',filePath).then(
            ()=>{
                driver.findElement(By.xpath('//*[@id="upload-form"]/table[2]/tbody/tr/td/span[1]/span')).click();
                console.log("上传完成");
            }
        )
    })
}
exports.switchSite = function (amzSite) {
    return driver.findElement(By.xpath('//*[@id="sc-mkt-picker-switcher-select"]')).click().then(
        ()=>{
            sleep.msleep(3*1000);
            return driver.findElement(By.xpath('//*[@id="dropdown1_0"]')).click();
        }
    );

}
exports.getUrlHtml = function (url) {
    return driver.get(url).then(()=>{
        sleep.msleep(15*1000);
        return driver.getPageSource();
    });
}
exports.onlyGet = function (url) {
    driver.get(url);
}
exports.close=function () {
    driver.close();
}
exports.quit=function () {
    //console.log(driver);
    if(driver != undefined)driver.quit();
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
