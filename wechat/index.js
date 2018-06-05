const crypto = require('crypto');
const util = require('util');
const fs = require('fs');
const axios = require('axios');
const urltil = require('url');
const accessTokenJson = require('./access_token'); // 引入本地存储的 access_token
const { parseString } = require('xml2js'); // 引入xml2js包
const menus = require('./menus'); // 引入微信菜单配置
const msg = require('./msg'); // 引入消息处理模块
const CryptoGraphy = require('./cryptoGraphy'); // 微信消息加解密模块
const saishi_list = require('../contest_list.json');

const writeFile = util.promisify(fs.writeFile);

class Wechat {
  constructor(config) {
    this.config = config;
    this.token = config.token;
    this.appID = config.appID;
    this.appSecret = config.appSecret;
    this.apiDomain = config.apiDomain;
    this.apiURL = config.apiURL;
  }

  async getAccessToken() {
    // 获取当前时间
    const currentTime = new Date().getTime();
    // 格式化请求地址
    const url = util.format(this.apiURL.accessTokenApi, this.apiDomain, this.appID, this.appSecret);
    // 判断 本地存储的 access_token 是否有效
    if (accessTokenJson.access_token === '' || accessTokenJson.expires_time < currentTime) {
      const { data: result } = await axios.get(url);
      if ('errcode' in result) {
        accessTokenJson.access_token = result.access_token;
        accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
        // 更新本地存储的
        await writeFile('./access_token.json', JSON.stringify(accessTokenJson), 'utf-8');
        // 将获取后的 access_token 返回
        return accessTokenJson.access_token;
      }
      // 将错误返回
      return result;
    }
    // 将本地存储的 access_token 返回
    return accessTokenJson.access_token;
  }

  async auth(req, res) {
    const that = this;

    await this.getAccessToken();
    this.setMenu();

    // 1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
    let signature = req.query.signature, // 微信加密签名
      timestamp = req.query.timestamp, // 时间戳
      nonce = req.query.nonce, // 随机数
      echostr = req.query.echostr; // 随机字符串

    // 2.将token、timestamp、nonce三个参数进行字典序排序
    const array = [this.token, timestamp, nonce];
    array.sort();

    // 3.将三个参数字符串拼接成一个字符串进行sha1加密
    const tempStr = array.join('');
    const hashCode = crypto.createHash('sha1'); // 创建加密类型
    const resultCode = hashCode.update(tempStr, 'utf8').digest('hex'); // 对传入的字符串进行加密

    // 4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if (resultCode === signature) {
      res.send(echostr);
    } else {
      res.send('mismatch');
    }
  }

  handleMsg(req, res) {
    let buffer = [],
      that = this;

    // 实例微信消息加解密
    const cryptoGraphy = new CryptoGraphy(that.config, req);

    // 监听 data 事件 用于接收数据
    req.on('data', (data) => {
      buffer.push(data);
    });
    // 监听 end 事件 用于处理接收完成的数据
    req.on('end', () => {
      const msgXml = Buffer.concat(buffer).toString('utf-8');
      // 解析xml
      parseString(msgXml, {
        explicitArray: false,
      }, (err, result) => {
        if (!err) {
          result = result.xml;
          // 判断消息加解密方式
          if (req.query.encrypt_type == 'aes') {
            // 对加密数据解密
            result = cryptoGraphy.decryptMsg(result.Encrypt);
          }
          const toUser = result.ToUserName; // 接收方微信
          const fromUser = result.FromUserName; // 发送仿微信
          let reportMsg = ''; // 声明回复消息的变量

          // 判断消息类型
          console.log(`${that.getTime()}\nMsg[${result.MsgType}${result.Event ? `.${result.Event}` : ''}]\tfrom ${fromUser}\t->${result.Content}`);
          if (result.MsgType.toLowerCase() === 'event') {
            // 判断事件类型
            switch (result.Event.toLowerCase()) {
              case 'subscribe':
                // 回复消息
                var content = '欢迎关注清华大学学生科协公众号，回复“赛事”可以查看赛事列表，回复“创意大赛”查看相关内容，回复其他内容获取专属滑稽[Smirk]。';
                reportMsg = msg.txtMsg(fromUser, toUser, content);
                break;
              case 'click':
                reportMsg = that.getReply(fromUser, toUser, result.EventKey);
                break;
            }
          } else {
            // 判断消息类型为 文本消息
            if (result.MsgType.toLowerCase() === 'text') {
              // 根据消息内容返回消息信息
              if (result.Content === 'more') {
                if (that.more[fromUser]) {
                  reportMsg = that.more[fromUser];
                } else {
                  reportMsg = msg.txtMsg(fromUser, toUser, '没有更多了[Concerned]');
                }
              } else {
                reportMsg = that.getReply(fromUser, toUser, result.Content);
              }
            }
          }
          if (typeof reportMsg === 'object') { // 判断是单条消息的string还是多条消息array
            if (reportMsg.length > 1) {
              that.more[fromUser] = reportMsg.slice(1);
              reportMsg = `${reportMsg[0]}\n.\n.\n.\n查看更多请输入 more`;
            } else {
              reportMsg = reportMsg[0];
              that.more[fromUser] = undefined;
            }
            reportMsg = msg.txtMsg(fromUser, toUser, reportMsg);
          }
          reportMsg = req.query.encrypt_type == 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg;
          res.send(reportMsg);
          console.log('-Replied.');
        } else {
          // 打印错误
          console.log(err);
        }
      });
    });
  }

  getReply(fromUser, toUser, content, res = undefined) {
    let reply;
    let replied = false;
    for (var i = 1; i <= saishi_list.length; i++) {
      if (content === `sh${i}`) {
        reply = [{
          Title: `${saishi_list[content]} `,
          Description: '赛事详情',
          PicUrl: 'https://cloud.tsinghua.edu.cn/f/dc712a0588344a879de9/?dl=1',
          Url: `saishi?no=${i}`,
        }];
        replied = true;
      }
    }
    if (!replied) {
      switch (content) {
        case '赛事':
          reply = `赛事列表：(回复对应代码查看详情)\n${saishi_list.list}`;
          break;
        case '创意大赛':
          reply = [{
            Title: '创意大赛',
            Description: '',
            PicUrl: 'https://cloud.tsinghua.edu.cn/f/1415ad6a77f04ff295c9/?dl=1',
            Url: 'https://mp.weixin.qq.com/s/twhKqjK_aBDyuxB9nmX3IA',
          },
          {
            Title: '新闻稿',
            Description: '',
            Url: 'http://news.tsinghua.edu.cn/publish/thunews/10303/2018/20180524110451627595360/20180524110451627595360_.html?from=singlemessage&isappinstalled=0',
          },
          ];
          break;
        case '挑战杯':
          reply = [{
            Title: '挑战杯终审',
            Description: '',
            PicUrl: 'https://mmbiz.qpic.cn/mmbiz_jpg/SVtYAMekLSjQffKSSfh8mkDvOpRatgZQGzDqd9mZRF7M3TmAjlSkjNxTEBxEgf1bYgibNWA8vwEqicQs6aia60VYg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1',
            Url: 'https://mp.weixin.qq.com/s/YKuQFReLxmhm-DpBlRKxKQ',
          },
          {
            Title: '挑战杯启动推送',
            Description: '',
            Url: 'https://mp.weixin.qq.com/s/dur3o8gi67vmQBPWsMgXpw',
          },
          ];
          break;
        case '加入校科协':
          reply = [{
            Title: '—— Come Join Us ——',
            Description: '',
            PicUrl: 'https://mmbiz.qpic.cn/mmbiz_jpg/SVtYAMekLSiajbmliagDdhpVhFKbhag2BAmuxeZicCoiadWDohRsK8rO3we4rQiboicaZc3LScYSLQVUaMpyDl9VOFpw/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1',
            Url: 'https://mp.weixin.qq.com/s/bRoso9se2q8KpOuEIn-ZAg',
          }];
          break;
        default: // 默认回复：滑稽*random()
          // var defaultMsg=['[Smirk]']
          // reportMsg = msg.txtMsg(fromUser,toUser,defaultMsg[Math.floor(Math.random()*defaultMsg.length)]);
          var hj = '[Smirk]';
          reply = '';
          var repeat = Math.random() * 6 + 1;
          for (var i = 0; i < repeat; i++) {
            reply += hj;
          }
          break;
      }
    }
    if (typeof reply !== 'string') {
      return msg.graphicMsg(fromUser, toUser, reply);
    }
    const max_len = 800;
    if (reply.length > max_len) {
      const arr = reply.split('\n');
      let arr_ = [],
        arr__ = [];
      for (var i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].length / max_len; i++) {
          arr_.push(arr[i].slice(j * max_len, (j + 1) * max_len));
        }
      }
      let msg_ = arr_[0];
      for (var i = 1; i < arr_.length; i++) {
        if (msg_.length + arr_[i].length <= max_len) {
          msg_ += `\n${arr_[i]}`;
        } else {
          arr__.push(msg_);
          msg_ = arr_[i];
        }
      }
      arr__.push(msg_);
      return arr__;
    }
    return msg.txtMsg(fromUser, toUser, reply);
  }

  async setMenu() {
    const that = this;
    const url = util.format(that.apiURL.createMenu, that.apiDomain, accessTokenJson.access_token);
    // 使用 Post 请求创建微信菜单
    data = await requestPost(url, JSON.stringify(menus));
    console.log(data);
  }

  getTime() {
    const now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }
}

module.exports = Wechat;
