var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var chrome = require('selenium-webdriver/chrome');
var o = new chrome.Options();
o.addArguments("user-data-dir=C:\\Chrome\\User Data\\");
//o.addArguments("user-data-dir=C:\\Users\\xleox\\AppData\\Local\\Google\\Chrome\\User Data\\");
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(o).build();

driver.get('http://sellercentral.amazon.com/gp/homepage.html');

driver.wait(function() {
    return driver.getTitle()
        .then( title => {
            console.log("title: " + title);
            return title !== "";
        });
}, 5000);