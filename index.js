const express = require('express');
const Wechat = require('./wechat');
const config = require('./config');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

process.on('unhandledRejection', (e) => {
  throw e;
});

process.on('uncaughtException', (e) => {
  console.error('Uncaught exception', e);
  process.exit(1);
});

const app = express();

const wechatApp = new Wechat(config);

app.get('/wechat-api', (req, res) => { // 微信验证请求
  console.log('Received Authentication Request.');
  wechatApp.auth(req, res);
});

app.post('/wechat-api', bodyParser.xml({
  xmlParseOptions: {
    explicitArray: false,
  },
}), (req, res) => {
  wechatApp.handleMsg(req, res);
});

app.get('/wechat-api/menu', async (req, res) => { // 强制刷新菜单接口
  if (req.query.refresh === config.refresh_key) {
    await wechatApp.getAccessToken();
    await wechatApp.setMenu();
  }
  res.send();
});

app.get('/saishi', (req, res) => { // 获取赛事详情
  res.send('Success');
});

app.listen(8000);
console.log('Server listening on 8000......');
