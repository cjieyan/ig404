const puppeteer = require('puppeteer');
var MongoDB = require('./mongodb');
const crypto = require('crypto');
(async () => {
	const browser = await puppeteer.launch({headless: false,
	args: ['--no-sandbox','–disable-setuid-sandbox']});
	const page = await browser.newPage();

	///登陆
	while(true){
		try{
			await page.goto('https://www.instagram.com/accounts/login/');
			await page.waitFor(3000);
			await page.type('input[name=username]', config.instagram.username, {delay: 5});
			await page.type('input[name=password]', config.instagram.password, {delay: 5});
			page.click('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(4) > button') //然后点击搜索
			break
		}catch(e){
			console.log("login error ...");
		}
	}
	await page.waitFor(1000);
	var error_num = 0




	while(true){
		let goto_url = "";
					while (true){
						try{
							await page.goto("https://www.instagram.com/ashin_ig/");
							await page.waitFor(3000);
							break;
						}catch(e){
							console.log("ashin_ig error " + error_num)
							error_num ++
						}
					}
					var suggetiog_ele = "#react-root > section > main > div > header > section > ul > li:nth-child(3) > a"
					const searchButton = await page.$(suggetiog_ele);
					if(searchButton){
					  const box = await searchButton.boundingBox();
					  const x = box.x + (box.width/2);
					  const y = box.y + (box.height/2);
					  const r = await Promise.all([
						  page.mouse.click(x,y),
					  ]);
					}
					await page.waitFor(1000);

					let i = 0;
					let follow_num = await page.$eval("#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > span", el=>el.innerText)
					console.log("follow_num : " + follow_num);
					while(i <100){
						i++;
						var resultsSelector = 'a.notranslate'
						try{
							await page.waitForSelector(resultsSelector, {timeout: 1000});
						}catch(e){
							console.log("a.notranslate....");
							continue
						}
						const item_lists = await page.evaluate(resultsSelector => {
						  const anchors = Array.from(document.querySelectorAll(resultsSelector));
						  return anchors.map(item_list => {
							 return {
							   'href':item_list.href
							 }
						   });
						 }, resultsSelector);



						 console.log(item_lists.length, follow_num, item_lists.length >= follow_num)


					 	 await page.waitFor(500);

						 if(item_lists.length >= follow_num){
console.log(111);
							 let created_at =  new Date().getTime();
							 for (var ii = 0; ii < item_lists.length; ii++) {
console.log(222);
							     let href = item_lists[ii]['href'];
							     let href_md5 = crypto.createHash('md5').update(href).digest("hex")
							     MongoDB.findOne("user_hrefs", {"href_md5": href_md5}, function(err, res){
							         console.log(res)
							         //return;
							         if( ! res){
							             MongoDB.save('user_hrefs',
							                 { href: href, "href_md5":href_md5, "flag" :0, 'created_at':created_at },
							                  function (err, res) {
							                     console.log(err);
							             });
							         }
							     })
							 }
						     break;
						 }
					 	 await autoScroll()
					}
	}

	async function autoScroll() {
	  await page.evaluate(async () => {
		  try {
		  	document.querySelector("div.isgrP").scrollBy(0, 300 );
		  } catch (e) {}
	  });
	}
	browser.close();
})()
