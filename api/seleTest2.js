const sleep = require('sleep');
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const chrome = require('selenium-webdriver/chrome');
const Promise = require("bluebird");

let accountInf={
    首页信息:{
        名称:{xpath:'//*[@id="sc-mkt-switcher-form"]/div',值:""},
        等待中:{xpath:'//*[@id="widget-fxmXCT"]/div/div[2]/div[1]/span[1]/span/a/div[1]/span',值:""},
        未发货先配送:{xpath:'//*[@id="widget-fxmXCT"]/div/div[2]/div[1]/span[2]/span/a/div[1]/span',值:""},
        未发货:{xpath:'//*[@id="widget-fxmXCT"]/div/div[2]/div[1]/span[3]/span/a/div[1]/span',值:""},
        退货请求:{xpath:'//*[@id="widget-fxmXCT"]/div/div[2]/div[1]/span[4]/span/a/div[1]/span',值:""},
        产品数量:{xpath:'//*[@id="agsBILWidget"]/div[1]/div/table/tbody/tr[1]/td[1]/div/div/div/a',值:""},
        订单数量:{xpath:'//*[@id="OrderSummary"]/div/div[1]/div/div/div/div[2]',值:""},
        买家消息:{xpath:'//*[@id="bsm-record-metrics"]/span/span/a/div[1]/span',值:""},
        AtoZ:{xpath:'//*[@id="widget-fti8vf"]/div/div[2]/div[1]/span[1]/span/a/div[1]/span',值:""},
        信用卡拒付:{xpath:'//*[@id="widget-fti8vf"]/div/div[2]/div[1]/span[2]/span/a/div[1]/span',值:""},
        最近付款:{xpath:'//*[@id="fundTransferInfo"]/div/div[1]/div[2]/span/span/a/span',值:""},
        余额:{xpath:'//*[@id="seller-payments-widget"]/div[1]/div/div/div[2]/div/div/div/div[2]/span/span/a/span',值:""}
    }
};

/*var options = new chrome.Options();
options.addArguments("user-data-dir=D:\\Chrome\\User Data\\");*/
//options.addArguments("user-data-dir=C:\\Users\\xleox\\AppData\\Local\\Google\\Chrome\\User Data\\");
var driver;

exports.amazonLogin = function (username,password) {
    //var driver = new webdriver.Builder().forBrowser('chrome').build();
    var options = new chrome.Options();
    options.addArguments("user-data-dir=D:\\Chrome\\User Data2\\");
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
                            driver.findElements( By.xpath(xpaths.用户名))
                                .then(doc => {
                                    if(doc.length != 0)
                                        driver.findElement(By.xpath(xpaths.用户名)).clear()
                                            .then(()=>{return driver.findElement(By.xpath(xpaths.用户名)).sendKeys(username);})
                                            .then(()=>{return driver.findElement(By.xpath(xpaths.密码)).clear()})
                                            .then(()=>{return driver.findElement(By.xpath(xpaths.密码)).sendKeys(password);})
                                            .then(()=>{return driver.findElement(By.xpath(xpaths.登陆按钮)).click();});
                                    else
                                        driver.findElements( By.xpath(xpaths.密码))
                                            .then(doc => {
                                                if(doc.length != 0)
                                                    driver.findElement(By.xpath(xpaths.密码)).clear()
                                                        .then(()=>{return driver.findElement(By.xpath(xpaths.密码)).sendKeys(password);})
                                                        .then(()=>{return driver.findElement(By.xpath(xpaths.登陆按钮)).click();});
                                            });
                                        });
                        });
                    }
                /*return driver.wait(()=> {
                    return driver.getTitle()
                        .then( title => {  //等待进入界面
                            if(title.indexOf("主页") >= 0 || title.indexOf("Home") >= 0 ||
                                title.indexOf("两步") >= 0 || title.indexOf("Two") >= 0 ) return title;
                            else return false;
                        } );}, 90*1000)*/
                return driver.wait(until.elementLocated(By.xpath('//*[@id="widget-fxZAQm"]/div/div[1]/h2')), 60*1000)
                    .then(()=>{
                        return driver.getTitle()
                            .then( title => {return title;} );
                    })
            });
    }
exports.getHomeInf = function () {
    var keys=[];
    for(var key in accountInf.首页信息){
        keys.push(key);
    }
    Promise.map(keys,item=>{setTxt2Inf(accountInf.首页信息,item)})
        .finally(
            ()=>{console.log(accountInf.首页信息);}
        )
    /*setTxt2Inf(accountInf.首页信息,"名称")
        .then(()=>{
            console.log(accountInf.首页信息);
        })*/
    }
exports.quit=function () {
    driver.quit();
}
/**
 * 把数据写入到JSON里
 * @param infJson 根JSON
 * @param name JSON的key
 * @param xpath 读取的路径
 * @returns {*|PromiseLike<T>|Promise<T>}
 */
setTxt2Inf = function (infJson, name) {
    return getElementTextByXpath(infJson[name]['xpath'])
        .then(txt=>{
            console.log(txt);
            infJson[name]['值']=txt;
            return name;
        });
    }
/**
 * 从xpath获取txt文本
 * @param xpath
 * @returns {Promise<Array<WebElement>>}
 */
getElementTextByXpath = function (xpath) {
    return driver.findElements( By.xpath(xpath) )
            .then(doc => {
                if (doc.length != 0)
                    return driver.findElement(By.xpath(xpath))
                        .getText().then(txt => {return txt;});
                else
                    return '';
            });
    }