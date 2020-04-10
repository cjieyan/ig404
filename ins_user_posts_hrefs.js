const puppeteer = require('puppeteer');
const MongoDB = require('./mongodb');
const config= require('./config');
const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const crypto = require('crypto');
const tools = require('./tools');

var user_posts_hrefs = [];

var account_index = 0

var func0 = function(req, ret, callback){
	MongoDB.findOne("account", {"index": "index"}, function(err, res){
	    if(! res){//初始值
	        let data = {"index":"index", "value": account_index}
	        MongoDB.save("account", data, function(err, res){});
	    }else{
	        account_index = res['value'] + 1;
	        if(account_index >= config.instagram.length){
	            account_index = 0;
	        }
	        MongoDB.update("account", {"index":"index"}, {"value": account_index}, function(err, res){});
	    }
	});
	callback(req,ret,0)
}

var func1 = function(req, ret, callback){
	MongoDB.find("user_posts_hrefs", {"flag": 0}, null, 1000, function(err, res){
	    if(res){
			for(var i in res){
				//1.
				let href_md5 = res[i]['href_md5'];
				let posts_href = res[i]['posts_href'];
				let posts_href_data =  [posts_href,  href_md5]
				user_posts_hrefs.push(posts_href_data)
				//2.

			}
		}
	});
	callback(req,ret,0)
}

var func2 = function(req, ret, callback){
    (async () => {
        const browser = await puppeteer.launch({
            headless:false,
            args: ['--no-sandbox','–disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        let error_times = 0

		let accounts = config.instagram[account_index]
        ///登陆
        while(true){
            try{
				//await page.setUserAgent( tools.ua() );
                await page.goto('https://www.instagram.com/accounts/login/?source=auth_switcher');
                await page.waitFor(3000);
                await page.type('input[name=username]', accounts.username, {delay: 5});
                await page.type('input[name=password]', accounts.password, {delay: 5});
                page.click('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(4) > button') //然后点击搜索
                break;
            }catch(e){
                console.log("login error ...", e);
            }
        }

        await page.waitFor(3000);
        while(user_posts_hrefs.length > 0){
						let post_href_data = user_posts_hrefs.pop()
						let post_href = post_href_data[0]
						let href_md5 = post_href_data[1]

		        let goto_url = post_href;
						console.log("goto_url: " + goto_url);
						while(true){
								try{
									//await page.setUserAgent( tools.ua() );
				            await page.goto(goto_url);
										break;
								}catch(e){
										console.log("goto_url error" , e);
										continue;
								}
						}

						try{
								let Error = await page.$eval(".main h2", el => el.innerText);
								if( "Error" == Error ){
										tools.dd("ins_user_info: instagram Error! Please wait a few minutes before you try again.");
										await browser.close();
										process.exit();
								}
						}catch(e){}


						let posts_href_md5 = crypto.createHash('md5').update(post_href).digest("hex")
						MongoDB.update('user_posts_hrefs',
							{"posts_href_md5":posts_href_md5}, { "flag" : config.production },
							function (err, res) {
									if(err){
											console.log(err);
									}else{
											console.log(res);
									}
							});

						 await page.waitFor( 3000 )
						 let resultsSelector = "ul.YlNGR li"


						 let video_src = [];
						 let video_src_md5 = []
						 let img_src = [];
						 let img_src_md5 = [];
						 let media_type = "img";

		                //#############################
		                //#######  1.下载图片  #########
		                //#############################
							while(true){
									try{
											const nextBtn = await page.$("button._6CZji");
							        if(nextBtn){
									          const box = await nextBtn.boundingBox();
									          const x = box.x + (box.width/2);
									          const y = box.y + (box.height/2);
									          const r = await Promise.all([
									              page.mouse.click(x,y),
									          ]);
										  }else{
											  	break
										  }
									}catch(e){
											break
									}



									const media_src_list = await page.evaluate(resultsSelector => {
										  const anchors = Array.from(document.querySelectorAll(resultsSelector));
										  return anchors.map(item_list => {
												 let video_src = ""
												 try{
												 		video_src = item_list.querySelector("video").src
												 }catch(e){
													 	video_src = ""
												 }

												 let img_src2 = ""
												 try{
												 		img_src2 = item_list.querySelector("img").src
												 }catch(e){
													 	img_src2 = ""
												 }
												 return {
												    "video_src" : video_src,
												    'img_src': img_src2
												 }
										   });
									 }, resultsSelector);

									 for (var key in media_src_list) {

											 // TODO: video1
											  let video_src_tmp = media_src_list[key]['video_src']
											  if(video_src_tmp && video_src.indexOf(video_src_tmp) < 0 ){
							  			      video_src_tmp = video_src_tmp.replace(new RegExp("&amp;",'g'),"&");
													  video_src.push(video_src_tmp)
													  video_src_md5.push(  crypto.createHash('md5').update(video_src_tmp).digest("hex") )
													  await tools.downloadVideo(video_src_tmp).then(function(resolve, reject){})
													  media_type = "video"
											  }
											  // TODO: img1
											  let img_src_tmp = media_src_list[key]['img_src']
								  			    img_src_tmp = img_src_tmp.replace(new RegExp("&amp;",'g'),"&");
											  let img_src_tmp_md5 = crypto.createHash('md5').update(img_src_tmp).digest("hex")
											  if(img_src_tmp && img_src_md5.indexOf(img_src_tmp_md5 ) < 0){
													  img_src.push(img_src_tmp)
													  img_src_md5.push(  img_src_tmp_md5 )
													  await tools.downloadImage(img_src_tmp).then(function(resolve, reject){})
											  }
									 }
						 }


						 //获取video
						 if(0 == img_src.length){
			 					try{
									// TODO: video2
									 let video_src_tmp = "";
									 try{
						           video_src_tmp = await page.$eval("article video", el => el.src);
									 		 video_src_tmp = video_src_tmp.replace(new RegExp("&amp;",'g'),"&");
									 }catch(e){}
									 if( video_src_tmp ){//video
											 video_src.push(video_src_tmp)
										 	 video_src_md5.push(  crypto.createHash('md5').update(video_src_tmp).digest("hex") )
											 await tools.downloadVideo(video_src_tmp).then(function(resolve, reject){})
											 media_type = "video"
									 }
									 // TODO: img2
									 let article_html = await page.$eval("article div.wKWK0", el => el.innerHTML);
									 if(article_html){
											 let img_reg = /<img.+?src="(.+?)"/gim;
											 while(tem=img_reg.exec(article_html)){
													 let img_src_tmp = tem[1]
													 img_src_tmp = img_src_tmp.replace(new RegExp("&amp;",'g'),"&");
													 img_src.push(img_src_tmp)
													 img_src_md5.push(  crypto.createHash('md5').update(img_src_tmp).digest("hex") )
													 await tools.downloadImage(img_src_tmp).then(function(resolve, reject){})
											 }
									 }
								 }catch(e){
										 console.log('pos  at (0 == img_src.length) : continue .. ', e);
										 continue
								 }
						 }

						 console.log("media_src_list....", video_src, img_src)
						 //#############################
						 //#######  2.时间  ############
						 //#############################
					 	let time_html = ""
		        let time_ele = 'div.NnvRN > a > time'
						let time_html_times = 0
						while(true){
								time_html_times ++
								try{
				            time_html = await page.$eval(time_ele, el => el.outerHTML);
										break;
								}catch(e){
										if(time_html_times > 5){
												break;
										}
										continue;
								}
						}
		        let timeReg = /datetime=[\'\"]?([^\'\"]*)[\'\"]?/i;
		        let arr = time_html.match(timeReg)
		        let post_at = "";
		        if (arr && arr[1]) {
		            post_at = new Date(arr[1]).getTime();
		        }

						//#############################
						//#######  2.内容  ############
						//#############################
						//content
		        let content_ele = "div.C4VMK > span"
		        let content = ""
		 				let content_times = 0;
						while(true){
								content_times ++
								try{
			            	content = await page.$eval(content_ele, el => el.innerHTML);
										break;
								}catch(e){
										if(content_times > 5){
												break;
										}
										continue;
								}
						}

						let post_data = {
								'href_md5' : href_md5,
								'post_href' : post_href,
								'posts_href_md5' : posts_href_md5,
								"content" : content,
								"media_type" : media_type,
								"video_src" : video_src,
								'video_src_md5' : video_src_md5,
								"img_src" : img_src,
								"img_src_md5" : img_src_md5,
								"post_at" : post_at,
								"created_at" : new Date().getTime()
						}

						MongoDB.findOne("user_posts", {"posts_href_md5": posts_href_md5}, function(err, res){
								if( ! res){
										MongoDB.save('user_posts',
											post_data,
											function (err, res) {
												console.log(err);
											});
								}else{
										MongoDB.update('user_posts',{"posts_href_md5": posts_href_md5},
											post_data,
											function (err, res) {
												console.log(err);
											});
								}
						})


						//// TODO: comment
						let commentsSelector =  "div.eo2As ul.Mr508"

						let comments_list = await page.evaluate(commentsSelector => {
							  const anchors = Array.from(document.querySelectorAll(commentsSelector));
							  return anchors.map(item_list => {
										 let user_href = "" //notranslate
										 let head_img = ""  //img
										 let nickname = ""  //TlrDj
										 let content = ""  //TlrDj
										 let created_at = ""
										 let datetime_html = ""
										 try{
													user_href = item_list.querySelector("a.notranslate").href
													nickname = item_list.querySelector("a.notranslate").innerText
													head_img = item_list.querySelector("img").src
													content = item_list.querySelector("div.C4VMK span").innerText
													datetime_html = item_list.querySelector("time").outerHTML

													let timeRegC = /datetime=[\'\"]?([^\'\"]*)[\'\"]?/i;
													let arrC = datetime_html.match(timeRegC)
													if (arrC && arrC[1]) {
															created_at = new Date(arrC[1]).getTime();
													}
										 }catch(e){}

										 return {
													"user_href" : user_href,
													'nickname': nickname,
													"head_img" : head_img,
													'created_at' : created_at,
													"content" : content,
													"datetime_html": datetime_html,
													"created_at" : created_at
										 }
							   });
						 }, commentsSelector);

						 for (var i in comments_list){
								 let comment = comments_list[i]
								 comment["head_img"] = comment["head_img"].replace(new RegExp("&amp;",'g'),"&");

 								 let user_info_href_md5 = crypto.createHash('md5').update(comment["user_href"]).digest("hex")
								 let headimg_md5 = crypto.createHash('md5').update(comment["head_img"]).digest("hex")

                 MongoDB.findOne("user_info", {"href_md5": user_info_href_md5}, function(err, res){
										 let headimg_md5 =  ""
										 if(res){
											   headimg_md5 = res['headimg_md5']
										 }else{
		  								 	 headimg_md5 = crypto.createHash('md5').update(comment["head_img"]).digest("hex")

				 		 				  	 let ppath = "heads"
												 headimg_md5 =  headimg_md5
										 		 await tools.downloadImage(comment["head_img"], ppath).then(function(resolve, reject){})
										 }

										 let user_infos = {
												"href_md5" : href_md5,
												"user_info_href_md5" : user_info_href_md5,
												"headimg_md5": headimg_md5,
												"nickname" : comment["nickname"],
												"content" : comment['content'],
												"created_at" : comment["created_at"] ? comment["created_at"] : 0
										  }
										  MongoDB.save('user_posts_comments',
												   user_infos,
												   function (err, res) {}
											);
								 })
					 		}
        }
         //class end
 			  await tools.dd("ins_user_posts_hrefs happy ending...");
	    	console.log("ins_user_posts_hrefs happy ending...");
        await browser.close();
        process.exit();
    })();
    callback(req,ret,0);
}

var req = null;
var ret = null;
var async = require("async");
var callback = function(){};
async.series(
    [
        function(callback){
          func0(req,ret,callback);
        },
        function(callback){
          func1(req,ret,callback);
	  	  },
        function(callback){
          func2(req,ret,callback);
        }
    ]
);
