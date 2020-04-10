const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const crypto = require('crypto');
const math = require('math');
const config = require('./config');
const MongoDB = require('./mongodb');
const qiniu = require('./qiniu_upload/index.js');
const proc = require('process');

class tools {
  /**
  * 异步延迟
  * @param {number} time 延迟的时间,单位毫秒
  */
  static sleep(time = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    })
  };

  static async dd(content){//往钉钉发通知
      let exec = require('child_process').exec;
      let cmdStr = "curl 'https://oapi.dingtalk.com/robot/send?access_token=' "
       + "-H 'Content-Type: application/json'  "
       + "-d '{\"msgtype\": \"text\",  \"text\": { \"content\": \"" + content + "\" } }'";
      await exec(cmdStr, function(err,stdout,stderr){
      });
  }

  static async execCmd(cmd){
      let exec = require('child_process').exec;
      await exec(cmd, function(err,stdout,stderr){});

  }

  static year_month(){
    let date_ob = new Date();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    return year + month
  }



  static async downloadImage (img_url, ppath) {
      if( ! img_url) {
          console.log("downloadImage ... file empty");
         return
      }

      let dir = "images/" + ppath
      try{
          if(!Fs.existsSync(dir)) {
              Fs.mkdirSync(dir);//注意 不支持fs.mkdirSync("demo/index");
          }
      }catch(e){
          console.log("dir..." , dir, e)
      }
      const url = img_url

      let pfile =  crypto.createHash('md5').update(img_url).digest("hex") + ".jpg"
      if( Fs.existsSync(dir + "/" + pfile)) {//已存在
          console.log("ipfile exist..." )
          return
      }
      const path = Path.resolve(__dirname, dir, pfile)
      const writer = Fs.createWriteStream(path)
      try{
          const response = await Axios({
             url,
             method: 'GET',
             responseType: 'stream'
          })
          response.data.pipe(writer)
      }catch(e){
          console.log("download error img_url...", img_url, e.message);
          return
      }
      return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
      })
  }


  static async downloadVideo (video_url) {
      let pfile = crypto.createHash('md5').update(video_url).digest("hex") + ".mp4"

      if( Fs.existsSync( "images/videos/" + pfile)) {//已存在
          console.log("vpfile exist..." )
          return
      }

      const url = video_url
      const path = Path.resolve(__dirname, 'images/videos', pfile)
      const writer = Fs.createWriteStream(path)
      try{
          const response = await Axios({
             url,
             method: 'GET',
             responseType: 'stream'
          })
          response.data.pipe(writer)
      }catch(e){
          console.log("download error video_url...",  video_url, e.message);
          return
      }
      return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
      })
  }

  static  ua(){
      const agent_list =   [
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2226.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.4; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2224.3 Safari/537.36",
          "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 4.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.67 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.67 Safari/537.36",
          "Mozilla/5.0 (X11; OpenBSD i386) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1944.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.3319.102 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2309.372 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2117.157 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1866.237 Safari/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/4E423F",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.517 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1664.3 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1664.3 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.16 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1623.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.17 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36",
          "Mozilla/5.0 (X11; CrOS i686 4319.74.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.57 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1468.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1467.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1464.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1500.55 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.90 Safari/537.36",
          "Mozilla/5.0 (X11; NetBSD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36",
          "Mozilla/5.0 (X11; CrOS i686 3912.101.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36",
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.60 Safari/537.17",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1309.0 Safari/537.17",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/24.0.1295.0 Safari/537.15",
          "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.14 (KHTML, like Gecko) Chrome/24.0.1292.0 Safari/537.14",

          "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16",
          "Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14",
          "Mozilla/5.0 (Windows NT 6.0; rv:2.0) Gecko/20100101 Firefox/4.0 Opera 12.14",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0) Opera 12.14",
          "Opera/12.80 (Windows NT 5.1; U; en) Presto/2.10.289 Version/12.02",
          "Opera/9.80 (Windows NT 6.1; U; es-ES) Presto/2.9.181 Version/12.00",
          "Opera/9.80 (Windows NT 5.1; U; zh-sg) Presto/2.9.181 Version/12.00",
          "Opera/12.0(Windows NT 5.2;U;en)Presto/22.9.168 Version/12.00",
          "Opera/12.0(Windows NT 5.1;U;en)Presto/22.9.168 Version/12.00",
          "Mozilla/5.0 (Windows NT 5.1) Gecko/20100101 Firefox/14.0 Opera/12.0",
          "Opera/9.80 (Windows NT 6.1; WOW64; U; pt) Presto/2.10.229 Version/11.62",
          "Opera/9.80 (Windows NT 6.0; U; pl) Presto/2.10.229 Version/11.62",
          "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52",
          "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; de) Presto/2.9.168 Version/11.52",
          "Opera/9.80 (Windows NT 5.1; U; en) Presto/2.9.168 Version/11.51",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; de) Opera 11.51",
          "Opera/9.80 (X11; Linux x86_64; U; fr) Presto/2.9.168 Version/11.50",
          "Opera/9.80 (X11; Linux i686; U; hu) Presto/2.9.168 Version/11.50",
          "Opera/9.80 (X11; Linux i686; U; ru) Presto/2.8.131 Version/11.11",
          "Opera/9.80 (X11; Linux i686; U; es-ES) Presto/2.8.131 Version/11.11",
          "Mozilla/5.0 (Windows NT 5.1; U; en; rv:1.8.1) Gecko/20061208 Firefox/5.0 Opera 11.11",
          "Opera/9.80 (X11; Linux x86_64; U; bg) Presto/2.8.131 Version/11.10",
          "Opera/9.80 (Windows NT 6.0; U; en) Presto/2.8.99 Version/11.10",
          "Opera/9.80 (Windows NT 5.1; U; zh-tw) Presto/2.8.131 Version/11.10",
          "Opera/9.80 (Windows NT 6.1; Opera Tablet/15165; U; en) Presto/2.8.149 Version/11.1",
          "Opera/9.80 (X11; Linux x86_64; U; Ubuntu/10.10 (maverick); pl) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (X11; Linux i686; U; ja) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (X11; Linux i686; U; fr) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.1; U; zh-tw) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.1; U; sv) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.1; U; en-US) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.1; U; cs) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 6.0; U; pl) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 5.2; U; ru) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 5.1; U;) Presto/2.7.62 Version/11.01",
          "Opera/9.80 (Windows NT 5.1; U; cs) Presto/2.7.62 Version/11.01",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.2.13) Gecko/20101213 Opera/9.80 (Windows NT 6.1; U; zh-tw) Presto/2.7.62 Version/11.01",
          "Mozilla/5.0 (Windows NT 6.1; U; nl; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.01",
          "Mozilla/5.0 (Windows NT 6.1; U; de; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.01",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; de) Opera 11.01",
          "Opera/9.80 (X11; Linux x86_64; U; pl) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (X11; Linux i686; U; it) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.6.37 Version/11.00",
          "Opera/9.80 (Windows NT 6.1; U; pl) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.1; U; ko) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.1; U; fi) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.1; U; en-GB) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.1 x64; U; en) Presto/2.7.62 Version/11.00",
          "Opera/9.80 (Windows NT 6.0; U; en) Presto/2.7.39 Version/11.00",

          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1",
          "Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0",
          "Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20130401 Firefox/31.0",
          "Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:29.0) Gecko/20120101 Firefox/29.0",
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:25.0) Gecko/20100101 Firefox/29.0",
          "Mozilla/5.0 (X11; OpenBSD amd64; rv:28.0) Gecko/20100101 Firefox/28.0",
          "Mozilla/5.0 (X11; Linux x86_64; rv:28.0) Gecko/20100101  Firefox/28.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:27.3) Gecko/20130101 Firefox/27.3",
          "Mozilla/5.0 (Windows NT 6.2; Win64; x64; rv:27.0) Gecko/20121011 Firefox/27.0",
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:25.0) Gecko/20100101 Firefox/25.0",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:25.0) Gecko/20100101 Firefox/25.0",
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0",
          "Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0",
          "Mozilla/5.0 (Windows NT 6.2; rv:22.0) Gecko/20130405 Firefox/23.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:23.0) Gecko/20130406 Firefox/23.0",
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:23.0) Gecko/20131011 Firefox/23.0",
          "Mozilla/5.0 (Windows NT 6.2; rv:22.0) Gecko/20130405 Firefox/22.0",
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:22.0) Gecko/20130328 Firefox/22.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:22.0) Gecko/20130405 Firefox/22.0",
          "Mozilla/5.0 (Microsoft Windows NT 6.2.9200.0); rv:22.0) Gecko/20130405 Firefox/22.0",
          "Mozilla/5.0 (Windows NT 6.2; Win64; x64; rv:16.0.1) Gecko/20121011 Firefox/21.0.1",
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:16.0.1) Gecko/20121011 Firefox/21.0.1",
          "Mozilla/5.0 (Windows NT 6.2; Win64; x64; rv:21.0.0) Gecko/20121011 Firefox/21.0.0",
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20130331 Firefox/21.0",
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (X11; Linux i686; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.2; WOW64; rv:21.0) Gecko/20130514 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.2; rv:21.0) Gecko/20130326 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:21.0) Gecko/20130401 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:21.0) Gecko/20130331 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:21.0) Gecko/20130330 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:21.0) Gecko/20130401 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:21.0) Gecko/20130328 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 5.1; rv:21.0) Gecko/20130401 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 5.1; rv:21.0) Gecko/20130331 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 5.1; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 5.0; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0",
          "Mozilla/5.0 (Windows NT 6.2; Win64; x64;) Gecko/20100101 Firefox/20.0",
          "Mozilla/5.0 (Windows x86; rv:19.0) Gecko/20100101 Firefox/19.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20100101 Firefox/19.0",
          "Mozilla/5.0 (Windows NT 6.1; rv:14.0) Gecko/20100101 Firefox/18.0.1",
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:18.0)  Gecko/20100101 Firefox/18.0",
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:17.0) Gecko/20100101 Firefox/17.0.6",

          "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko",
          "Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0;  rv:11.0) like Gecko",
          "Mozilla/5.0 (compatible; MSIE 10.6; Windows NT 6.1; Trident/5.0; InfoPath.2; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727) 3gpp-gba UNTRUSTED/1.0",
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 7.0; InfoPath.3; .NET CLR 3.1.40767; Trident/6.0; en-IN)",
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/5.0)",
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/4.0; InfoPath.2; SV1; .NET CLR 2.0.50727; WOW64)",
          "Mozilla/5.0 (compatible; MSIE 10.0; Macintosh; Intel Mac OS X 10_7_3; Trident/6.0)",
          "Mozilla/4.0 (Compatible; MSIE 8.0; Windows NT 5.2; Trident/6.0)",
          "Mozilla/4.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/5.0)",
          "Mozilla/1.22 (compatible; MSIE 10.0; Windows 3.1)",
          "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))",
          "Mozilla/5.0 (Windows; U; MSIE 9.0; Windows NT 9.0; en-US)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 7.1; Trident/5.0)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; InfoPath.3; MS-RTC LM 8; Zune 4.7)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; InfoPath.3; MS-RTC LM 8; Zune 4.7",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 4.0; InfoPath.3; MS-RTC LM 8; .NET4.0C; .NET4.0E)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; chromeframe/12.0.742.112)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 2.0.50727; SLCC2; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 4.0; Tablet PC 2.0; InfoPath.3; .NET4.0C; .NET4.0E)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; yie8)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.2; .NET CLR 1.1.4322; .NET4.0C; Tablet PC 2.0)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; FunWebProducts)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; chromeframe/13.0.782.215)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; chromeframe/11.0.696.57)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0) chromeframe/10.0.648.205",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.1; SV1; .NET CLR 2.8.52393; WOW64; en-US)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0; chromeframe/11.0.696.57)",
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/4.0; GTB7.4; InfoPath.3; SV1; .NET CLR 3.1.76908; WOW64; en-US)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; InfoPath.1; SV1; .NET CLR 3.8.36217; WOW64; en-US)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; .NET CLR 2.7.58687; SLCC2; Media Center PC 5.0; Zune 3.4; Tablet PC 3.6; InfoPath.3)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.2; Trident/4.0; Media Center PC 4.0; SLCC1; .NET CLR 3.0.04320)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 1.1.4322)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; InfoPath.2; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; SLCC1; .NET CLR 1.1.4322)",
          "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.0; Trident/4.0; InfoPath.1; SV1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 3.0.04506.30)",
          "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 5.0; Trident/4.0; FBSMTWB; .NET CLR 2.0.34861; .NET CLR 3.0.3746.3218; .NET CLR 3.5.33652; msn OptimizedIE8;ENUS)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; Media Center PC 6.0; InfoPath.2; MS-RTC LM 8)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; Media Center PC 6.0; InfoPath.2; MS-RTC LM 8",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; Media Center PC 6.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET4.0C)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; InfoPath.3; .NET4.0C; .NET4.0E; .NET CLR 3.5.30729; .NET CLR 3.0.30729; MS-RTC LM 8)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; InfoPath.2)",
          "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 3.0)",

          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; da-dk) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; tr-TR) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; ko-KR) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; fr-FR) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; cs-CZ) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; ja-JP) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10_5_8; zh-cn) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10_5_8; ja-jp) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; ja-jp) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; zh-cn) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; sv-se) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; ko-kr) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; ja-jp) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; it-it) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; fr-fr) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; es-es) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-us) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-gb) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; de-de) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; sv-SE) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; ja-JP) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; de-DE) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; hu-HU) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; de-DE) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; ru-RU) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; ja-JP) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; it-IT) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/534.16+ (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; fr-ch) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; de-de) AppleWebKit/534.15+ (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; ar) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; zh-HK) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; tr-TR) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; nb-NO) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 6.0; fr-FR) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-TW) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Windows; U; Windows NT 5.1; ru-RU) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; zh-cn) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5"
        ]
        let ua = agent_list[parseInt(math.random() * agent_list.length)]
        return ua
  }
  static slowRand(){
      let rand_arr = [1000, 2000, 3000]
      return rand_arr[parseInt(math.random() * rand_arr.length)]
  }

  static gotoSlowRand(){
    let rand_arr = [10000, 15000, 12000]
    return rand_arr[parseInt(math.random() * rand_arr.length)]
  }

  static account(){
      let accounts = config.instagram
      return accounts[parseInt(math.random() * accounts.length)]
  }


  static async userPosts(page, post_href, href_md5){

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
                          await tools.downloadImage(img_src_tmp, "posts").then(function(resolve, reject){})
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
                         await tools.downloadImage(img_src_tmp, "posts").then(function(resolve, reject){})
                     }
                 }
               }catch(e){
                   console.log('pos  at (0 == img_src.length) : continue .. ', e);
                   return
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
                        if(err){
                            console.log(err);
                        }
                    })
              }else{
                  MongoDB.update('user_posts',
                    {"posts_href_md5": posts_href_md5},
                    post_data,
                    function (err, res) {
                        if(err){
                            console.log(err);
                        }
                    })
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

               await tools.downloadImage(comment["head_img"], "heads").then(function(resolve, reject){})
               MongoDB.findOne("user_posts_comments", {"href_md5": href_md5}, function(err, res){

                       if(res){//已有评论
                          return
                       }
                       MongoDB.findOne("user_info", {"href_md5": user_info_href_md5}, function(err, res){
                       let headimg_md5 =  ""
                       if(res){
                           headimg_md5 = res['headimg_md5']
                       }else{
                           headimg_md5 = crypto.createHash('md5').update(comment["head_img"]).digest("hex")
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
                             function (err, res2) {}
                        );
                        //下载头像
                        if( !res || ! res['headimg_md5']){
                           //tools.downloadImage(comment["head_img"], "heads").then(function(resolve, reject){})
                        }

                   })
               })
            }
            return true
  }
  static  heredoc(fn) {
        return fn.toString().split('\n').slice(1,-1).join('\n') + '\n'
  }
}
