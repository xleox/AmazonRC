var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var chrome = require('selenium-webdriver/chrome');
var options;
var driver;

exports.amazonLogin = function (username,password) {
    options = new chrome.Options();
    options.addArguments("user-data-dir=C:\\Chrome\\User Data\\");
    //o.addArguments("user-data-dir=C:\\Users\\xleox\\AppData\\Local\\Google\\Chrome\\User Data\\");
    driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(o).build();
    driver.get('http://sellercentral.amazon.com/gp/homepage.html');

    driver.wait(()=> {
        return driver.getTitle()
            .then( title => {  //等待进入界面
                if(title.indexOf("Amazon") >= 0) return title;
                else return false;
            } );}, 5000)
            .then( title =>{
                if(title.indexOf("登录") >= 0 || title.indexOf("login") >= 0 ){
                    console.log("进入账户界面");
                    console.log(until.elementLocated(By.xpath('//!*[@id="ap_email"]')));
                    console.log(until.elementLocated(By.xpath('//!*[@id="ap_password"]')));
                    console.log(until.elementLocated(By.xpath('//!*[@id="authportal-main-section"]/div[2]/div/div/form/div/div/div/div[3]/div/div/label/div/label/input')));

                    /*driver.wait(until.elementLocated(By.xpath('//!*[@id="ap_email"]')), 5000).then(()=>{console.log("用户名框")});
                    driver.wait(until.elementLocated(By.xpath('//!*[@id="ap_password"]')), 5000).then(()=>{console.log("密码框")});
                    driver.wait(until.elementLocated(By.xpath('//!*[@id="authportal-main-section"]/div[2]/div/div/form/div/div/div/div[3]/div/div/label/div/label/input')), 5000).then(()=>{console.log("记住框")});
                    */
                }
            });
    }