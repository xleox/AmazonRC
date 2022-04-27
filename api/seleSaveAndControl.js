const sleep = require('sleep');
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const chrome = require('selenium-webdriver/chrome');
const Promise = require('bluebird');
const config = require('./setting').config;

let driver;
let amazonHost = 'amazon.com';
if (config.站点 !== undefined) amazonHost = config.站点;

exports.amazonLogin = function (username, password) {
    let options = new chrome.Options();
    if (amazonHost === 'amazon.com') options.addArguments('user-data-dir=C:\\Chrome\\User Data\\');
    else options.addArguments('user-data-dir=C:\\Chrome\\' + amazonHost + '\\');
    options.addArguments('--start-maximized');
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build();
    driver.manage().window().maximize();
    driver.get('http://sellercentral.' + amazonHost + '/gp/homepage.html/ref=xx_home_logo_xx');
    return driver.wait(() => {
        return driver.getTitle().then( title => {  //等待进入界面
            if (title.indexOf('Amazon') >= 0 || title.indexOf('亚马逊') >= 0) return title;
            else return false;
        });}, 60000).then( title => {
            if (title.indexOf('登录') >= 0 || title.indexOf('Sign') >= 0) {
                console.log('进入登陆界面');
                let xpaths = {
                    用户名: '//*[@id="ap_email"]',
                    密码: '//*[@id="ap_password"]',
                    记住框: '//*[@id="authportal-main-section"]/div[2]/div/div/form/div/div/div/div[3]/div/div/label/div/label/input',
                    登陆按钮: '//*[@id="signInSubmit"]',
                    选择账户: '//*[@id="ap-account-switcher-container"]/div[1]/div/div/div[2]/div[1]/div[2]/a/div/div[2]/div/div/div[2]'
                };
                sleep.msleep(10 * 1000); // 实际用时延长
                driver.findElements(By.xpath(xpaths.选择账户)).then(doc => { if(doc.length !== 0) driver.findElement(By.xpath(xpaths.选择账户)).click(); });
                driver.wait(until.elementLocated(By.xpath(xpaths.登陆按钮)), 60 * 1000).then(() => {
                    driver.findElements(By.name('rememberMe')).then(doc => {
                        if(doc.length !== 0)
                            driver.findElement(By.name('rememberMe')).isSelected().then( checked=>{ if(!checked) driver.findElement(By.name('rememberMe')).click(); });
                    });
                    sleep.msleep(2 * 1000); //实际用时延长
                    Promise.all(inputTxtByXpath(xpaths.用户名, username), inputTxtByXpath(xpaths.密码, password)).finally(() => {
                        driver.findElement(By.xpath(xpaths.登陆按钮)).click();
                    })
                });
            }
            return driver.wait(() => {
                return driver.getTitle().then( title => {  //等待进入界面
                    // if(title.indexOf("主页") >= 0 || title.indexOf("Home") >= 0 || title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 )
                    if (title.indexOf('登录') === -1 && title.indexOf('Sign') === -1) return title;
                    else return false;
                });
            }, 120 * 1000)
        });
    }
exports.getHomePageHtml = function () { return driver.getPageSource(); }
exports.getOrderPageHtml = function () {
    driver.manage().window().maximize();
    driver.get("https://sellercentral." + amazonHost + "/orders-v3/mfn/unshipped?date-range=last-30&sort=order_date_desc&page=1");
    return driver.getTitle().then( title => {  //等待进入界面
        if (title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
        else return false;
    } , 60000).then(title => {
        console.log("订单管理-未发货");
        let xpaths = { 进入新版本: "/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a" };
        driver.findElements(By.xpath(xpaths.进入新版本)).then(doc => { if(doc.length !== 0) driver.findElement(By.xpath(xpaths.进入新版本)).click(); });
        // 查看订单数量
        return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10 * 1000).then(() => {
            sleep.msleep(20 * 1000);
            return driver.getPageSource();
        });
    });
}
exports.getOrderShippedPageHtml = function () {
    driver.manage().window().maximize();
    driver.get("https://sellercentral." + amazonHost + "/orders-v3/mfn/shipped?date-range=last-30&sort=ship_by_desc&page=1");
    return driver.getTitle().then( title => {  //等待进入界面
        if (title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
        else return false;
    } , 60000).then(title => {
        console.log("订单管理-已发货");
        let xpaths = { 进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a' };
        driver.findElements( By.xpath(xpaths.进入新版本)).then(doc => { if(doc.length !== 0) driver.findElement(By.xpath(xpaths.进入新版本)).click(); });
        // 查看订单数量
        return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10 * 1000).then(() => {
            sleep.msleep(20 * 1000);
            return driver.getPageSource();
        });
    });
}
exports.getOrderCancelPageHtml = function () {
    driver.manage().window().maximize();
    //driver.get('https://sellercentral.amazon.com/orders-v3?ref_=ag_myo_dnav_xx_&_encoding=UTF8');
    driver.get("https://sellercentral." + amazonHost + "/orders-v3/mfn/canceled?sort=order_date_desc&page=1&date-range=last-30");
    return driver.getTitle().then( title => {  //等待进入界面
        if (title.indexOf("Manage Orders") >= 0 || title.indexOf("管理订单") >= 0 ) return title;
        else return false;
    } , 60000).then(title => {
        console.log('订单管理-已取消');
        let xpaths = { 进入新版本:'/html/body/div[5]/div/div[1]/table/tbody/tr/td/div[2]/a' };
        driver.findElements( By.xpath(xpaths.进入新版本)).then(doc => { if(doc.length !== 0) driver.findElement(By.xpath(xpaths.进入新版本)).click(); });
        // 查看订单数量
        return driver.wait(until.elementLocated(By.xpath('//*[@id="myo-layout"]/div[2]/div[1]/div[1]/div/span[1]')), 10 * 1000).then(() => {
            sleep.msleep(20 * 1000);
            return driver.getPageSource();
        });
    });
}
exports.getInventoryPageHtml = function () {
    driver.manage().window().maximize();
    // https://sellercentral.amazon.com/hz/inventory/view/FBAKNIGHTS/ref=xx_fbamnginv_dnav_xx
    return driver.get("https://sellercentral." + amazonHost + "/hz/inventory/view/FBAKNIGHTS/ref=xx_fbamnginv_dnav_xx").then(() => {
        sleep.msleep(15*1000);
        return driver.getPageSource();
    });
};
exports.sendItems = async function (url, trackIDs) {
    // await driver.manage().window().setRect({x: 0, y: 0, width: 1920, height: 969});
    await driver.manage().window().maximize();
    await driver.get(url);
    await sleep.msleep(30 * 1000);
    let pageTitle = await driver.getTitle();
    if (pageTitle.match(/Manage Orders|管理订单/g) !== null) {
        console.log('1 - 打开页面');
        // console.log('页面标题：', pageTitle);
        let pageHtml = await driver.getPageSource();
        if (pageHtml.indexOf('bulk-confirm-shipment-submit') !== -1) {
            if (pageHtml.indexOf('BulkConfirmShipment-ShipFromDropdown') !== -1) {
                await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div/div/span/span/span')).click();
                await sleep.msleep(1000);
                let addressLi = await driver.findElements(By.xpath('//*[@id="a-popover-1"]/div/div/ul/li'));
                let addressIdx = addressLi.length - 1;
                await sleep.msleep(1000);
                await driver.findElement(By.xpath('//*[@id="BulkConfirmShipment-ShipFromDropdown_' + addressIdx + '"]')).click();
                console.log('2 - 地址选择');
                await sleep.msleep(1000);
                await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[3]/div[1]/span[2]/span/span')).click();
                await sleep.msleep(1000);
                if (trackIDs[0].selectName === '其他') {
                    await driver.findElement(By.xpath('//*[@id="CarrierListDropdown--1_1"]')).click();
                    await sleep.msleep(1000);
                    await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[3]/div[1]/span[2]/span/span')).click();
                }
                await sleep.msleep(2 * 1000);
                await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].selectName +'")]')).click();
                console.log('3 - 承运人选择');
                await sleep.msleep(2 * 1000);
                if (trackIDs[0].selectName === '其他') {
                    await driver.findElement(By.xpath('//*[@id="customCarrierInput--1"]')).clear();
                    await sleep.msleep(1000);
                    await driver.findElement(By.xpath('//*[@id="customCarrierInput--1"]')).sendKeys(trackIDs[0].companyName);
                    await sleep.msleep(3 * 1000);
                    await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[3]/div[2]/div/div[2]/div/span[2]/input')).sendKeys(trackIDs[0].serviceContent);
                    console.log('4 - 选择配送服务');
                } else {
                    if (trackIDs[0].serviceSelect !== '其他') {
                        await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[3]/div[2]/div/div[2]/div/span[1]/span/span')).click();
                        await sleep.msleep(2 * 1000);
                        if (trackIDs[0]['selectName'] === 'Yun Express') {
                            try {
                                await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].serviceSelect +'")]')).click();
                            } catch (e) {
                                await driver.findElement(By.xpath('//a[contains(text(),"YunExpress Global Direct line (standard )-Tracked")]')).click();
                            }
                            console.log('4 - 选择配送服务');
                        } else {
                            await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].serviceSelect +'")]')).click();
                            console.log('4 - 选择配送服务');
                        }
                    } else {
                        await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[3]/div[2]/div/div[2]/div/span[2]/input')).sendKeys(trackIDs[0].serviceContent);
                        console.log('4 - 选择配送服务');
                    }
                }
                await sleep.msleep(5 * 1000);
                let sendMission = [];
                for (let i = 0; i < trackIDs.length; i++) {
                    sendMission.push(inputTxtByXpath('//*[@id="bulk-confirm-orders-table"]/tbody/tr[contains(string(), "' + trackIDs[i].orderID + '")]/td[6]/span/input', trackIDs[i].trackID));
                }
                await Promise.all(sendMission);
                console.log('5 - 填写发货编号');
                await sleep.msleep(10 * 1000);
                // scrollIntoView 是一个与页面滚动相关的API，参数为true：页面滚动，使element的顶部与视图顶部对齐。参数为false：页面滚动，使element的底部与视图底部对齐
                await driver.executeScript('arguments[0].scrollIntoView(false);', driver.findElement(By.xpath('//*[@value="确认发货"]')));
                console.log('6 - 调整页面滚动条');
                await sleep.msleep(3 * 1000);
                //*[@value="确认发货"]
                await driver.findElement(By.xpath('//*[@data-test-id="bulk-confirm-shipment-submit"]')).click();
                console.log('6 - 确认发货点击');
                await sleep.msleep(3 * 1000);
            } else {
                console.log('1 - 开始执行');
                await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[1]/span[2]/span/span')).click();
                await sleep.msleep(1000);
                if (trackIDs[0].selectName === '其他') {
                    console.log('2 - 选择第一条物流');
                    await driver.findElement(By.xpath('//*[@id="CarrierListDropdown--1_1"]')).click();
                    await sleep.msleep(2 * 1000);
                    console.log('3 - 再次点击承运人选择器');
                    //*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[1]/span[2]
                    await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[1]/span[2]/span'));
                }
                await sleep.msleep(2 * 1000);
                await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].selectName +'")]')).click();
                console.log('3 - 选择承运人');
                await sleep.msleep(2 * 1000);
                if (trackIDs[0].selectName === '其他') {
                    await driver.findElement(By.xpath('//*[@id="customCarrierInput--1"]')).clear();
                    await sleep.msleep(2 * 1000);
                    await driver.findElement(By.xpath('//*[@id="customCarrierInput--1"]')).sendKeys(trackIDs[0].companyName);
                    await sleep.msleep(2 * 1000);
                    await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/span[2]/input')).sendKeys(trackIDs[0].serviceContent);
                    console.log('3 - 选择配送服务');
                } else {
                    if (trackIDs[0].serviceSelect !== '其他') {
                        await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/span[1]/span/span')).click();
                        await sleep.msleep(2 * 1000);
                        if (trackIDs[0].selectName === 'Yun Express') {
                            try {
                                await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].serviceSelect +'")]')).click();
                            } catch (e) {
                                await driver.findElement(By.xpath('//a[contains(text(),"YunExpress Global Direct line (standard )-Tracked")]')).click();
                            }
                        } else {
                            await driver.findElement(By.xpath('//a[contains(text(),"'+ trackIDs[0].serviceSelect +'")]')).click();
                        }
                    } else {
                        await driver.findElement(By.xpath('//*[@id="MYO-app"]/div/div[2]/div/div/div[2]/div/div/div[2]/div[2]/div/div[2]/div/span[2]/input')).sendKeys(trackIDs[0].serviceContent);
                    }
                }
                await sleep.msleep(5 * 1000);
                let sendMission = [];
                for (let i=0; i < trackIDs.length; i++) {
                    sendMission.push(inputTxtByXpath('//*[@id="bulk-confirm-orders-table"]/tbody/tr[contains(string(), "' + trackIDs[i].orderID + '")]/td[6]/span/input', trackIDs[i].trackID));
                }
                await Promise.all(sendMission);
                await sleep.msleep(10 * 1000);
                // scrollIntoView 是一个与页面滚动相关的API，参数为true：页面滚动，使element的顶部与视图顶部对齐。参数为false：页面滚动，使element的底部与视图底部对齐
                await driver.executeScript('arguments[0].scrollIntoView(false);', driver.findElement(By.xpath('//*[@value="确认发货"]')));
                await sleep.msleep(3 * 1000);
                // await driver.findElement(By.xpath('//*[@value="确认发货"]')).click();
                await driver.findElement(By.xpath('//*[@data-test-id="bulk-confirm-shipment-submit"]')).click();
            }
        } else { return false; }
    } else { return false; }
};
// 上传表格/取款
exports.uploadListing = function (url, filePath) {
    driver.get(url);
    return driver.wait(()=> {
        return driver.getTitle().then( title => {  //等待进入界面
            if (title.indexOf("Upload") >= 0 || title.indexOf("上传商品") >= 0 ) return title;
            else return false;
        });
    }, 60000).then(title => {
        console.log("准备上传");
        driver.findElement(By.xpath('//*[@id="a-autoid-2-announce"]/span')).click();
        sleep.msleep(3*1000);
        driver.findElement(By.xpath('//*[@id="dropdown1_0"]')).click();
        sleep.msleep(2*1000);
        driver.findElement(By.xpath('//*[@id="reportOutputColumn"]/span/div[1]/label/i')).click();
        inputTxtByXpath('//*[@id="upload-form"]/table[1]/tbody/tr[3]/td/span/input',filePath).then(() => {
            driver.findElement(By.xpath('//*[@id="upload-form"]/table[2]/tbody/tr/td/span[1]/span')).click();
            console.log("上传完成");
        })
    })
}
exports.switchSite = function (amzSite) {
    return driver.findElement(By.xpath('//*[@id="sc-mkt-picker-switcher-select"]')).click().then(()=>{
        sleep.msleep(3 * 1000);
        return driver.findElement(By.xpath('//*[@id="dropdown1_0"]')).click();
    });
}
exports.getUrlHtml = function (url) {
    return driver.get(url).then(() => {
        sleep.msleep(20 * 1000);
        return driver.getPageSource();
    });
}
exports.onlyGet = function (url) { driver.get(url); }
exports.close = function () { driver.close(); }
exports.quit = function () { if(driver !== undefined) driver.quit(); }
/**
 * 输入input
 * @param xpath
 * @returns {Promise<Array<WebElement>>}
 */
let inputTxtByXpath = function (xpath, v) {
    return driver.findElements( By.xpath(xpath) ).then(doc => {
        if (doc.length !== 0) {
            return driver.findElement(By.xpath(xpath)).getAttribute('value').then(value => {
                if (value === "") {
                    return driver.findElement(By.xpath(xpath)).sendKeys(v);
                } else if (xpath === '//*[@id="carrierName_UNSHIPPEDITEMS"]') {
                    return driver.findElement(By.xpath(xpath)).clear().then(doc => {
                        sleep.msleep(1000);
                        return driver.findElement(By.xpath(xpath)).sendKeys(v);
                    });
                } else return "";
            });
        } else return '';
    });
}
exports.accountInf = function () { return accountInf; }
