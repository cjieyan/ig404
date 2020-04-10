const puppeteer = require('puppeteer');
var MongoDB = require('./mongodb');
const config= require('./config');
const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const crypto = require('crypto');
//const func = require('./func');

//
// MongoDB.save('tests', {id: 22}, function (err, res) {
//     console.log(err);
// });

async function downloadImage (img_url) {
   const url = img_url
   const path = Path.resolve(__dirname, 'images', crypto.createHash('md5').update(img_url).digest("hex") + ".jpg")
   const writer = Fs.createWriteStream(path)

   const response = await Axios({
       url,
       method: 'GET',
       responseType: 'stream'
   })
   response.data.pipe(writer)
   return new Promise((resolve, reject) => {
       writer.on('finish', resolve)
       writer.on('error', reject)
   })
}

(async () => {
    const browser = await puppeteer.launch({
        headless:false,
        args: ['--no-sandbox','–disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let goto_url = "https://www.instagram.com/ashin_ig/";
    await page.goto(goto_url);
    //查询所有分类标签
    //class start
    class_sel = "article"
    await page.waitForSelector(class_sel);
    //#############################
    //#######  1.列表  #############
    //#############################
    const img_lists = await page.evaluate(class_sel => {
        const class_tars = Array.from(document.querySelectorAll(class_sel));
        return class_tars.map(item_list => {
           var a_href = item_list.querySelector("a").href;
           return {
             'a_href':a_href
           }
        });
    }, class_sel);
     //console.log(img_lists)
    let timeReg = /datetime=[\'\"]?([^\'\"]*)[\'\"]?/i;
    for(var i in img_lists){
        let goto_url = img_lists[i]['a_href'];
        await page.goto(goto_url);
        var img_ele = 'img.FFVAD';
        //var img_src = await page.$eval(img_ele, el => el.srcset);
        var img_src = await page.$eval(img_ele, el => el.src);
        var time_ele = 'div.NnvRN > a > time'
        var time_html = await page.$eval(time_ele, el => el.outerHTML);
        let arr = time_html.match(timeReg)
        var datetime = "";
        if (arr && arr[1]) {
            datetime = new Date(arr[1]).getTime();
            datetime = datetime/1000
            console.log(datetime)
        }

        //#############################
        //#######  1.下载图片  #############
        //#############################
        downloadImage(img_src).then(function(resolve, reject){
        })
        var content_ele = "div.C4VMK > span"
        var content_text = await page.$eval(content_ele, el => el.innerHTML);
    }
     //class end
    console.log( "happy ending......");
    await browser.close();
    process.exit()
})();
