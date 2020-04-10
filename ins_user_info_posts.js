const puppeteer = require('puppeteer');
var MongoDB = require('./mongodb');
const config = require('./config');
const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const crypto = require('crypto');
var tools = require('./tools');

var user_hrefs = [];
var account_index = 0;
var func0 = function (req, ret, callback) {

    MongoDB.findOne("account", {"index": "index"}, function (err, res) {
        if (!res) {//初始值
            let data = {"index": "index", "value": 0}
            MongoDB.save("account", data, function (err, res) {
            });
        } else {
            account_index = res['value'] + 1;
            if (account_index >= config.instagram.length) {
                account_index = 0;
            }
            let data = {"value": account_index}
            MongoDB.update("account", {"index": "index"}, data, function (err, res) {
            });
        }
    });
    callback(req, ret, 0)
}

var func1 = function (req, ret, callback) {
    MongoDB.find("user_hrefs", {"has_info": 0}, null, 1000, function (err, res) {
        if (res) {
            for (var i in res) {
                //1.
                let href = res[i]['href']
                user_hrefs.push(href)
            }
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
                await page.goto('https://www.instagram.com/accounts/login/');
                await page.waitFor(3000);
                await page.type('input[name=username]', accounts.username, {delay: 1});
                await page.type('input[name=password]', accounts.password, {delay: 1});
                page.click('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(4) > button') //然后点击搜索
                break
            } catch (e) {
                console.log("login error ...");
            }
        }
        await page.waitFor(3000);
        while (user_hrefs.length > 0) {
            let error_times = 0

            let goto_url = user_hrefs.pop();
            console.log("goto_url: " + goto_url);
            let header_html = ""
            while (true) {
                try {
                    //await page.setUserAgent( tools.ua() );
                    await page.goto(goto_url);
                    header_html = await page.$eval("main header", el => el.innerHTML);
                    break;
                } catch (e) {
                    console.log("error_times:" + (++error_times));
                    if (error_times > 10) {
                        break;
                    }

                    try {
                        let Error = await page.$eval(".main h2", el => el.innerText);
                        if ("Error" == Error) {
                            tools.dd("instagram Error! Please wait a few minutes before you try again.");
                            await browser.close();
                            process.exit();
                        }
                    } catch (e) {
                    }
                    continue;
                }
            }


            try {
                let Error = await page.$eval("main h2", el => el.innerText);
                if ("Error" == Error) {
                    tools.dd("ins_user_info: instagram Error! Please wait a few minutes before you try again.");
                    await browser.close();
                    process.exit();
                }
            } catch (e) {
            }

            try {
                let private_ele = await page.$eval("main h2.rkEop", el => el.innerText);
                if ("This Account is Private" == private_ele) {
                    console.log("This Account is Private: ", goto_url);
                    continue
                }
            } catch (e) {
            }


            let html_data = await page.$eval("head", el => el.innerHTML)
            let html_reg = /"@type":"(.+?)","name"/gim;

            let user_type = "";
            while (tem = html_reg.exec(html_data)) {
                user_type = tem[1]
            }

            let href_md5 = crypto.createHash('md5').update(goto_url).digest("hex")
            MongoDB.update('user_hrefs',
                {"href_md5": href_md5}, {"has_info": config.production},
                function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                });


            let reg = /<span.+?Verified/gim;
            let verified = 0;
            while (tem = reg.exec(header_html)) {
                verified = 1
            }

            // nickname username
            let nickname = ""
            let username = ""
            let headimg_md5 = ""
            reg = /<h1.+?>(.+?)<\/h1>/gim;
            let name_arr = [];
            while (tem = reg.exec(header_html)) {
                name_arr.push(tem[1])
            }
            if (name_arr.length > 0) {
                nickname = name_arr[0]
                username = name_arr[1]
            }


            //headimg
            let headimg = "";
            reg = /<img.+?[profile|的头像].+?src="(.+?)"/gim;
            while (tem = reg.exec(header_html)) {
                headimg = tem[1]
            }
            if (headimg) {
                headimg = headimg.replace(new RegExp("&amp;", 'g'), "&");
                headimg_md5 = crypto.createHash('md5').update(headimg).digest("hex")
                //下载图片downloadImage
            }
            console.log("headimg....", headimg, headimg_md5);
            let posts = "0";
            reg = /<span.+>(.+?)<\/span> [posts|貼文|帖子]/gim;
            while (tem = reg.exec(header_html)) {
                posts = tem[1]
            }

            console.log("posts....", posts);
            posts = posts.replace(/,/g, '');

            let followers = "";
            reg = /<span.+title="(.+?)".+?[followers|位追蹤者|粉丝]/gim;
            while (tem = reg.exec(header_html)) {
                followers = tem[1]
            }

            let following = "";
            reg = /<span.+>(.+?)<\/span>.+?following/gim;
            while (tem = reg.exec(header_html)) {
                following = tem[1]
            }
            if (!following) {
                reg = /[正在追蹤|正在关注].+?<span.+>(.+?)<\/span>/gim;
                while (tem = reg.exec(header_html)) {
                    following = tem[1]
                }
            }

            let intro = ""
            reg = /<\/h1>.+?<br>.+?<span>(.+)<\/span>/gim;
            let flag = [];
            while (tem = reg.exec(header_html)) {
                intro = tem[1]
            }

            let intro_link = "";
            reg = /<a.+me.+_blank.+?>(.+?)<\/a>/gim;
            while (tem = reg.exec(header_html)) {
                intro_link = tem[1]
            }


            //保存用户信息
            let user_info = {
                "href": goto_url,
                "href_md5": href_md5,
                "nickname": nickname,
                "username": username,
                "headimg": headimg,
                "headimg_md5": headimg_md5,
                "verified": verified,
                "posts": posts,
                "followers": followers,
                "following": following,
                "intro": intro,
                "intro_link": intro_link,
                'type': user_type,
                "scrapy_count": 1,
                "created_at": new Date().getTime()
            };
            console.log("posts num: " + posts);

            await tools.downloadImage(user_info["headimg"], "heads").then(function (resolve, reject) {
            })
            MongoDB.findOne("user_info", {"href_md5": user_info['href_md5']}, function (err, res) {
                if (!res) {/////[] == true
                    MongoDB.save("user_info", user_info, function (err, res) {
                        //console.log("user_info", res )
                    });
                } else {
                    if (res['created_at']) {
                        user_info["created_at"] = res['created_at']
                    }
                    //console.log("user_info....  update", user_info)
                    MongoDB.update('user_info',
                        {"href_md5": user_info['href_md5']}, user_info,
                        function (err, res) {
                            if (err) {
                                console.log(err);
                            }
                        });
                }
            });

            ///////spider posts 数据
            if (posts > 0 && verified > 0) {
                //#############################
                //#######  1.列表  #############
                //#############################
                let class_sel = "article div.kIKUG"
                let i = 0;

                let scroll_times = 0;
                let user_posts_hrefs = []
                let phrefs = []


                let max_scroll_times = 100;
                if (posts > 1000) {
                    max_scroll_times = (posts / 10) + 20;
                }

                let scroll_time_obj = {}
                while (user_posts_hrefs.length < posts && scroll_times < max_scroll_times) {
                    let temp = []
                    //tools.sleep(1000)
                    try {
                        await page.waitForSelector(class_sel);
                        temp = await page.evaluate(class_sel => {
                            const class_tars = Array.from(document.querySelectorAll(class_sel));
                            return class_tars.map(item_list => {
                                let href = ""
                                let img_src = ""
                                try {
                                    href = item_list.querySelector("a").href
                                    img_src = item_list.querySelector("img.FFVAD").src
                                } catch (e) {
                                }
                                return {
                                    "href": href,
                                    'img_src': img_src
                                };
                            });
                        }, class_sel);
                    } catch (e) {
                        console.log("user_posts_hrefs break....", e);
                        break;
                    }
                    //await page.waitFor( tools.slowRand() )

                    for (var hkey in temp) {
                        let posts_href = temp[hkey]['href']
                        let img_pre_src = temp[hkey]['img_src']
                        img_pre_src = img_pre_src.replace(new RegExp("&amp;", 'g'), "&");
                        let img_pre_src_md5 = ""
                        if (img_pre_src) {
                            img_pre_src_md5 = crypto.createHash('md5').update(img_pre_src).digest("hex")
                        }
                        let posts_href_md5 = crypto.createHash('md5').update(posts_href).digest("hex")
                        if (posts_href && user_posts_hrefs.indexOf(posts_href_md5) < 0) {
                            phrefs.push(posts_href)
                            user_posts_hrefs.push(posts_href_md5)
                            let created_at = new Date().getTime()
                            let posts_hrefs_data = {
                                "href_md5": href_md5,
                                "posts_href": posts_href,
                                "posts_href_md5": posts_href_md5,
                                "flag": 0,
                                "created_at": created_at
                            }
                            MongoDB.findOne("user_posts_hrefs",
                                {"posts_href_md5": posts_href_md5},
                                function (err, res) {
                                    if (!res) {
                                        MongoDB.save("user_posts_hrefs", posts_hrefs_data, function (err, res) {
                                        });
                                    }
                                }
                            );

                            let post_data = {
                                'href_md5': href_md5,
                                'post_href': posts_href,
                                'posts_href_md5': posts_href_md5,
                                'img_pre_src': img_pre_src,
                                'img_pre_src_md5': img_pre_src_md5,
                                "created_at": created_at
                            }
                            console.log("post_data.....", post_data)

                            await tools.downloadImage(img_pre_src, "posts").then(function (resolve, reject) {
                            })

                            MongoDB.findOne("user_posts",
                                {"posts_href_md5": posts_href_md5},
                                function (err, res) {
                                    if (!res) {
                                        MongoDB.save('user_posts',
                                            post_data,
                                            function (err, res) {
                                                if (err) {
                                                    console.log("user_posts save", err);
                                                }
                                            });
                                    } else {
                                        if (res['created_at']) {
                                            post_data['created_at'] = res['created_at']
                                        }
                                        MongoDB.update('user_posts',
                                            {"posts_href_md5": posts_href_md5},
                                            post_data,
                                            function (err, res) {
                                                if (err) {
                                                    console.log("user_posts, update", err);
                                                }
                                            }
                                        )
                                    }
                                })
                        }
                    }

                    let pro = "scroll_" + user_posts_hrefs.length;
                    if (scroll_time_obj.hasOwnProperty(pro)) {
                        scroll_time_obj[pro] = ++scroll_time_obj[pro]
                    } else {
                        scroll_time_obj[pro] = 1
                    }

                    break
                    console.log("scroll_times : " + (scroll_times++) + "  user_posts_hrefs num : " + user_posts_hrefs.length)

                ///////spider posts 数据
                if(posts > 0 && verified > 0){
                    //#############################
                    //#######  1.列表  #############
                    //#############################
                    let class_sel = "article div.kIKUG"
            				let i = 0;

                    let scroll_times = 0;
										let user_posts_hrefs = []
										let phrefs = []


										let max_scroll_times = 100;
										if(posts > 1000){
												max_scroll_times = ( posts / 10 ) + 20;
										}

										let scroll_time_obj = {}
                    while(user_posts_hrefs.length < posts && scroll_times < max_scroll_times){
													let temp = []
													//tools.sleep(1000)
                          try{
                            	await page.waitForSelector(class_sel);
                                temp = await page.evaluate(class_sel => {
                                    const class_tars = Array.from(document.querySelectorAll(class_sel));
                                    return class_tars.map(item_list => {
																			 let href = ""
																			 let img_src = ""
																			  try{
																					  href = item_list.querySelector("a").href
																					  img_src = item_list.querySelector("img.FFVAD").src
																			  }catch(e){}
                                        return {
																					 "href": href,
																					 'img_src': img_src
																			  };
                                    });
                                }, class_sel);
                          }catch(e){
															  console.log( "user_posts_hrefs break....", e);
                                break;
                          }
													//await page.waitFor( tools.slowRand() )

													for (var hkey in temp) {
																let posts_href = temp[hkey]['href']
																let img_pre_src = temp[hkey]['img_src']
															  img_pre_src = img_pre_src.replace(new RegExp("&amp;",'g'),"&");

																let posts_href_md5 = crypto.createHash('md5').update(posts_href).digest("hex")
																if( posts_href && user_posts_hrefs.indexOf( posts_href_md5 ) < 0 ){
																		phrefs.push(posts_href)
																		user_posts_hrefs.push( posts_href_md5 )
																		let created_at = new Date().getTime()
																		let posts_hrefs_data = {
																				"href_md5" : href_md5,
																				"posts_href" : posts_href,
																				"posts_href_md5" : posts_href_md5,
																				"flag" : 0,
																				"created_at" : created_at
																		}
																		MongoDB.findOne("user_posts_hrefs",
																				{"posts_href_md5": posts_href_md5},
																				function(err, res){
																						if( ! res){
																								MongoDB.save("user_posts_hrefs", posts_hrefs_data, function(err, res){});
																						}
																				}
																	  );

					 													let img_pre_src_md5 = crypto.createHash('md5').update(img_pre_src).digest("hex")
																		let post_data = {
																				'href_md5' : href_md5,
																				'post_href' : posts_href,
																				'posts_href_md5' : posts_href_md5,
																			  'img_pre_src' : img_pre_src,
																				'img_pre_src_md5' : img_pre_src_md5,
																				"created_at" : created_at
																		}


																		MongoDB.findOne("user_posts",
																				{"posts_href_md5": posts_href_md5},
																				function(err, res){
																						if( ! res ){
																								MongoDB.save('user_posts',
																									post_data,
																									function (err, res) {
																										if(err){
																												console.log("user_posts save", err);
																										}
																									});
																									 tools.downloadImage(img_pre_src, "posts").then(function(resolve, reject){})
																						}else{
																								if(res['created_at']){
																										post_data['created_at'] = res['created_at']
																								}
																								MongoDB.update('user_posts',
																										{"posts_href_md5": posts_href_md5},
																										post_data,
																										function (err, res) {
																											if(err){
																													console.log("user_posts, update", err);
																											}
																									  }
																								)
																								if( ! res['img_pre_src_md5']  ){
																										 tools.downloadImage(img_pre_src, "posts").then(function(resolve, reject){})
																								}
																						}
																		  })
																}
														}

														let pro = "scroll_" + user_posts_hrefs.length;
														if(scroll_time_obj.hasOwnProperty(pro))  {
																scroll_time_obj[pro] = ++ scroll_time_obj[pro]
														}else{
																scroll_time_obj[pro] = 1
														}

														if(user_posts_hrefs.length > 0){
																break
														}
														console.log("scroll_times : " + (scroll_times ++ ) + "  user_posts_hrefs num : " + user_posts_hrefs.length)

														if(scroll_time_obj[pro] > 10){
																break
														}
														if(scroll_time_obj[pro] == 4){
                            	  await autoScrollUp();//往上滚
		                            async function autoScrollUp() {
		                                  await page.evaluate(async () => {
		                                      try {
		                                          window.scrollBy(0, -3500);
		                                      } catch (e) {}
		                                  });
		                            }
																continue
														}else{
																await autoScroll();//正常滚
		                            async function autoScroll() {
		                                  await page.evaluate(async () => {
		                                      try {
		                                          window.scrollBy(0, 1500);
		                                      } catch (e) {}
		                                  });
		                            }
														}
                    }
                    if (scroll_time_obj[pro] == 4) {
                        await autoScrollUp();//往上滚
                        async function autoScrollUp() {
                            await page.evaluate(async () => {
                                try {
                                    window.scrollBy(0, -3500);
                                } catch (e) {
                                }
                            });
                        }

                        continue
                    } else {
                        await autoScroll();//正常滚
                        async function autoScroll() {
                            await page.evaluate(async () => {
                                try {
                                    window.scrollBy(0, 1500);
                                } catch (e) {
                                }
                            });
                        }
                    }
                }


                //抓取用户的posts
                while (phrefs.length > 0) {
                    let post_href = phrefs.pop()
                    await tools.userPosts(page, post_href, href_md5)
                }

            }
        }

        //class end
        await tools.dd("ins_user_info happy ending...");
        console.log("ins_user_info happy ending...");
        await browser.close();
        process.exit();
    })();
    callback(req, ret, 0);
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
