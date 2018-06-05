const express = require('express');
const wechat = require('./wechat');
const config = require('./config');

var app = express();

var wechatApp = new wechat(config);

app.get('/wechat-api', function(req, res) { //微信验证请求
    console.log('Received Authentication Request.')
    wechatApp.auth(req, res);
});

app.post('/wechat-api', function(req, res) {
    wechatApp.handleMsg(req, res);
});

app.get('/wechat-api/menu', function(req, res) { //强制刷新菜单接口
    if (req.query.refresh === 'root') {
        wechatApp.setMenu();
        wechatApp.getAccessToken();
    }
});

app.get('/saishi', function(req, res) { //获取赛事详情
    res.send('Success');
})

app.listen(80);
console.log('Server listening on 80.')
