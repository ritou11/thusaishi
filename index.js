const express = require('express');
const wechat = require('./wechat');
const config = require('./config');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

const app = express();

const wechatApp = new wechat(config);

app.get('/wechat-api', (req, res) => { // 微信验证请求
  console.log('Received Authentication Request.');
  wechatApp.auth(req, res);
});

app.post('/wechat-api', bodyParser.xml(), (req, res) => {
  wechatApp.handleMsg(req, res);
});

app.get('/wechat-api/menu', (req, res) => { // 强制刷新菜单接口
  if (req.query.refresh === 'root') {
    wechatApp.setMenu();
    wechatApp.getAccessToken();
  }
});

app.get('/saishi', (req, res) => { // 获取赛事详情
  res.send('Success');
});

app.listen(8000);
console.log('Server listening on 8000......');
