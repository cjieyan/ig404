const puppeteer = require('puppeteer');
var MongoDB = require('./mongodb');
const crypto = require('crypto');
const tools = require('./tools');
const config = require('./config');

var user_hrefs = [];
var account_index = 0

var func0 = function (req, ret, callback) {
    MongoDB.findOne("account", {"index": "index"}, function (err, res) {
        if (!res) {//初始值
            let data = {"index": "index", "value": account_index}
            MongoDB.save("account", data, function (err, res) {
            });
        } else {
            account_index = res['value'] + 1;
            if (account_index >= config.instagram.length) {
                account_index = 0;
            }
            MongoDB.update("account", {"index": "index"}, {"value": account_index}, function (err, res) {
            });
        }
    });
    callback(req, ret, 0)
}

var func1 = function (req, ret, callback) {
    MongoDB.find("user_hrefs", {"flag": 0}, null, 50, function (err, res) {
        if (res) {
            for (var i in res) {
                //1.
                let href = res[i]['href']
                user_hrefs.push(href)

                //2.
            }
        } else {

        }
    });
    callback(req, ret, 0)
}

var func2 = function (req, ret, callback) {
    (async () => {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '–disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        let accounts = config.instagram[account_index]

        ///登陆
        while (true) {
            try {
                console.log(accounts)
                //await page.setUserAgent( tools.ua() );
                await page.goto('https://www.instagram.com/accounts/login/');
                await page.waitFor(2000);
                await page.type('input[name=username]', accounts.username, {delay: 1});
                await page.type('input[name=password]', accounts.password, {delay: 1});
                page.click('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(4) > button') //然后点击搜索
                break
            } catch (e) {
                console.log("login error ...", e);
            }
        }
        await page.waitFor(3000);

        while (user_hrefs.length > 0) {
            let error_num = 0

            let goto_url = user_hrefs.pop()
            console.log("goto_url: " + goto_url)

            let update_href_md5 = crypto.createHash('md5').update(goto_url).digest("hex")
            MongoDB.update('user_hrefs',
                {"href_md5": update_href_md5}, {"flag": 1},
                function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                }
            );

            while (true) {
                try {
                    await page.goto(goto_url);
                    break;
                } catch (e) {
                    console.log("ashin_ig error " + error_num)
                    error_num++
                }
            }
            try {
                let Error = await page.$eval(".main h2", el => el.innerText);
                if ("Error" == Error) {
                    tools.dd("ins_user_hrefs: instagram Error! Please wait a few minutes before you try again.");
                    await browser.close();
                    process.exit();
                }
            } catch (e) {
            }
            try {
                let private = await page.$eval("h2.rkEop", el => el.innerText);
                if ("This Account is Private" == private) {
                    continue;
                }
            } catch (e) {
            }

            /** following **/
            var following_ele = "#react-root > section > main > div > header > section > ul > li:nth-child(3) > a"
            const searchButton = await page.$(following_ele);
            if (searchButton) {
                const box = await searchButton.boundingBox();
                const x = box.x + (box.width / 2);
                const y = box.y + (box.height / 2);
                const r = await Promise.all([
                    page.mouse.click(x, y),
                ]);
            }

            let i = 0;
            let follow_num = null;
            try {
                follow_num = await page.$eval("#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > span", el => el.innerText)
            } catch (e) {
                continue;//退出算了
            }
            if (0 == follow_num) {
                continue;
            }

            await page.waitFor(1000);
            let hrefs_list = []
            while (i < 50) {
                i++;
                //body > div.RnEpo.Yx5HN > div > div.isgrP > ul > div > li:nth-child(2) > div > div.t2ksc > div.enpQJ > div.d7ByH > span
                var resultsSelector = "ul._6xe7A li"// 'a.notranslate'
                //var resultsSelector = "span.coreSpriteVerifiedBadge"
                try {
                    await page.waitForSelector(resultsSelector, {timeout: 2000});
                } catch (e) {
                    console.log(resultsSelector + "....", e.message);
                    break;//ele报错直接丢弃
                }
                const item_lists = await page.evaluate(resultsSelector => {
                    const anchors = Array.from(document.querySelectorAll(resultsSelector));
                    return anchors.map(item_list => {
                        let is_verify = false
                        let href = ""
                        let nickname = ""
                        let username = ""
                        let img = ""
                        try {
                            href = item_list.querySelector("a.notranslate").href
                            nickname = item_list.querySelector("a.notranslate").innerText
                            username = item_list.querySelector("div.wFPL8").innerText
                            img = item_list.querySelector("img").src

                            //会报错
                            item_list.querySelector("span.coreSpriteVerifiedBadge").innerText
                            is_verify = true
                        } catch (e) {
                        }
                        return {
                            "href": href,
                            "nickname": nickname,
                            "username": username,
                            "is_verify": is_verify,
                            "img": img
                        }
                    });
                }, resultsSelector);
                console.log("item_lists...", item_lists);
                await page.waitFor(500);
                let created_at = new Date().getTime();
                let ppath = "heads"

                for (var ii = 0; ii < item_lists.length; ii++) {
                    let href = item_lists[ii]['href']
                    let verify = item_lists[ii]['is_verify']
                    let nickname = item_lists[ii]['nickname']
                    let headimg = item_lists[ii]['img']
                    headimg = headimg.replace(new RegExp("&amp;", 'g'), "&");
                    let username = item_lists[ii]['username']
                    console.log("item_lists href.....", href);
                    let href_md5 = crypto.createHash('md5').update(href).digest("hex")
                    if (href && hrefs_list.indexOf(href_md5) < 0) {
                        hrefs_list.push(href_md5);

                        headimg_md5 = crypto.createHash('md5').update(headimg).digest("hex")
                        //写入用户信息
                        let user_info = {
                            "href": href,
                            "href_md5": href_md5,
                            "nickname": nickname,
                            "username": username,
                            "headimg": headimg,
                            "headimg_md5": headimg_md5,
                            "verified": verify,
                            "created_at": new Date().getTime()
                        };

                        MongoDB.findOne("user_info", {"href_md5": user_info['href_md5']}, function (err, res) {
                            if (!res) {/////[] == true
                                MongoDB.save("user_info", user_info, function (err, res) {
                                    //console.log("user_info", res )
                                });
                                //下载图片downloadImage
                                tools.downloadImage(headimg, ppath).then(function (resolve, reject) {
                                })
                            } else {
                                if (res['headimg_md5']) {
                                    user_info["headimg_md5"] = res['headimg_md5']
                                }
                                if (res['created_at']) {
                                    user_info["created_at"] = res['created_at']
                                }
                                MongoDB.update('user_info',
                                    {"href_md5": user_info['href_md5']}, user_info,
                                    function (err, res) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                            }
                        });


                        if (false == verify) {
                            continue
                        }

                        let save_data = {
                            "href": href,
                            "href_md5": href_md5,
                            "flag": 0,
                            'has_info': 0,
                            'created_at': created_at
                        }
                        MongoDB.findOne("user_hrefs", {"href_md5": href_md5}, function (err, res) {
                            if (!res) {
                                MongoDB.save('user_hrefs', save_data,
                                    function (err, res) {
                                        console.log(err);
                                    });
                            }
                        })
                    }
                }

                if (item_lists.length >= follow_num) {
                    break;
                }
                await page.waitFor(100);
                await autoScroll();

                async function autoScroll() {
                    await page.evaluate(async () => {
                        try {
                            document.querySelector("div.isgrP").scrollBy(0, 300);
                        } catch (e) {
                        }
                    });
                }
            }
            if (hrefs_list.length <= 0) {
                break;
            }
            console.log("end followers num ", hrefs_list.length);
        }
        tools.dd("ins_user_hrefs happy ending...");
        await browser.close();
        process.exit();
    })();
    callback(req, ret, 0)
}


var req = null;
var ret = null;
var async = require("async");
var callback = function () {
};
async.series(
    [
        function (callback) {
            func0(req, ret, callback);
        },
        function (callback) {
            func1(req, ret, callback);
        },
        function (callback) {
            func2(req, ret, callback);
        }
    ]
);
