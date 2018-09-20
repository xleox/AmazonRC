var sleep = require('sleep');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var chrome = require('selenium-webdriver/chrome');

/*var options = new chrome.Options();
options.addArguments("user-data-dir=D:\\Chrome\\User Data\\");*/
//options.addArguments("user-data-dir=C:\\Users\\xleox\\AppData\\Local\\Google\\Chrome\\User Data\\");
var driver;

exports.amazonLogin = function (username,password) {
    //var driver = new webdriver.Builder().forBrowser('chrome').build();
    var options = new chrome.Options();
    options.addArguments("user-data-dir=D:\\Chrome\\User Data\\");
    //options.addArguments("user-data-dir=C:\\Users\\xleox-win10\\AppData\\Local\\Google\\Chrome\\User Data\\");
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build();
    driver.get('http://sellercentral.amazon.com/gp/homepage.html');

    return driver.wait(()=> {
        return driver.getTitle()
            .then( title => {  //等待进入界面
                if(title.indexOf("Amazon") >= 0 || title.indexOf("亚马逊") >= 0 ) return title;
                else return false;
            } );}, 5000)
            .then( title =>{
                //driver.quit();
                if(title.indexOf("登录") >= 0 || title.indexOf("login") >= 0 ){
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
                return driver.wait(()=> {
                    return driver.getTitle()
                        .then( title => {  //等待进入界面
                            if(title.indexOf("主页") >= 0 || title.indexOf("Home") >= 0 ||
                                title.indexOf("两步") >= 0 || title.indexOf("two") >= 0 ) return title;
                            else return false;
                        } );}, 60*1000)
            });
    }
exports.getHomeInf = function () {
    driver.findElement( By.xpath('//*[@id="sc-mkt-switcher-form"]/div'))
        .getText().then(b=>{console.log("text",b)});
}
exports.quit=function () {
    driver.quit();
}