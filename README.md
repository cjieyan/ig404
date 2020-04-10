# ig404
Instagram的Puppeteer爬虫解决方案

## **安装/配置**
```elm
# npm install
# docker run --name mongo  -p 27017:27017 -d mongo:latest --auth
配置config.js 支持多个Instagram账号轮换防止被ban
挂梯子后执行爬取
# node ins_user_info_posts
```

## **1.0.0已实现功能**
* 模拟账号登陆,支持多账号切换
* 根据八度人脉法,仅仅需要一个阿信的Instagram账号链接就能爬取其他所有Instagram认证用户
* 支持所有post内容爬取
* 支持支持高清图片海量异步下载
* 支持所有视频海量异步下载
* 支持评论内容爬取
* 支持用户信息爬取(头像、昵称、备注信息)
* 支持多进程爬取
* 失败重试
* 智能识别被ban退出,下次爬取切换账号
* 随机useragent
* 随机时间间隔爬取,可增量更新,对seo特别友好,有利于搜索引擎增加收录
* 搭载mongodb,去重新增,高频读写
* 封装钉钉机器人提示(需配置token)

## **后续持续更新并修bug**
* 支持ip代理池
* mongodb集群配置说明
* 海量数据存储
* ......

## **有疑问或bug望毫不吝惜提issue**
* 我将一一解答

## **大佬求赞求咖啡**
<img src="./images/wxpayimg.jpeg" width = "50%" height = "" div  />
