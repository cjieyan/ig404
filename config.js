// 定义一个 common.js 的模块
//模块定义
var config = {
    production:1,
    mongodb: {
        db_user: "tests",
        db_pwd: "",
        db_host: "127.0.0.1",
        db_port: 27017,
        db_name: "tests"
    },
    instagram :[
        {
            "username":"",
            "password":""
        },
        {
            "username":"",
            "password":""
        },
        {
            "username":"",
            "password":""
        }
    ]
};



// 模块接口的暴露
// module.exports = tools;
exports.production = config.production;//1正式环境配置 0 dev
// exports.mysql = config.mysql;
exports.pre = config.pre;
exports.mongodb = config.mongodb;
exports.instagram = config.instagram;
