const express = require('express'), //express 框架 
      wechat  = require('./wechat/wechat'), 
       config = require('./config');//引入配置文件
       
var app = express();//实例express框架

var wechatApp = new wechat(config); //实例wechat 模块

app.get('/',function(req,res){//微信验证请求
    console.log('Received Authentication Request.')
    wechatApp.auth(req,res);
});

app.post('/',function(req,res){
    wechatApp.handleMsg(req,res);
});

app.get('/menu',function(req,res){//强制刷新菜单接口
    if(req.query.refresh==='root'){
        wechatApp.setMenu();
        wechatApp.getAccessToken();
        res.send('Success!')
    }  
});

app.get('/saishi',function(req,res){//获取赛事详情
    if(req.query.no){
        wechatApp.getData(req.query.no,res);
    }
})
console.log('Server listening on 80.')

app.listen(80);