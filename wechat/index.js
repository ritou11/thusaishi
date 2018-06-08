const crypto = require('crypto');
const util = require('util');
// const fs = require('fs');
const axios = require('axios');
const menus = require('./menus'); // 引入微信菜单配置
const msg = require('./msg'); // 引入消息处理模块
const CryptoGraphy = require('./cryptoGraphy'); // 微信消息加解密模块
const saishiList = require('../contest_list.json');

// const writeFile = util.promisify(fs.writeFile);
let accessTokenJson;

const getTime = () => new Date().toISOString();

const getReply = (fromUser, toUser, content) => {
  let reply;
  const m = content.match(/^ss(\d+)$/);
  if (m) {
    const i = parseInt(m[1], 10);
    reply = [{
      Title: `${saishiList.data[`ss${i}`]} `, // TODO
      Description: '赛事详情',
      PicUrl: 'http://thusaishi.nogeek.cn/assets/kx.png',
      Url: `http://thusaishi.nogeek.cn/saishi${i}.html`,
    }];
  } else {
    switch (content.trim()) {
      case '赛事': case '赛事列表':
        reply = `赛事列表：(回复对应代码查看详情)\n${saishiList.list}`; // TODO
        break;
      case '创意大赛':
        reply = [{
          Title: '“跨国情缘” | 第七届创意大赛为中芬大学生搭建创意交流桥梁',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/junction.jpg',
          Url: 'https://mp.weixin.qq.com/s/twhKqjK_aBDyuxB9nmX3IA',
        },
        {
          Title: '清华大学举行第七届创意大赛 | 中芬学生展开创意比拼',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'http://news.tsinghua.edu.cn/publish/thunews/10303/2018/20180524110451627595360/20180524110451627595360_.html',
        },
        ];
        break;
      case '新生专场':
        reply = [{
          Title: '创意大赛 | 新生专场，期待你的创意梦想！',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/xs.png',
          Url: 'https://mp.weixin.qq.com/s/ouMrv9ufbwVUPJTibdq9Fg',
        },
        {
          Title: '创无止境 | 第七届创意大赛新生专场圆满落幕',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'https://mp.weixin.qq.com/s/urwBTJmWo_dvaSwqij_k6Q',
        },
        ];
        break;
      case '三创博览会':
        reply = [{
          Title: '邀请函 | 三创博览会游玩指南',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/scblh.png',
          Url: 'https://mp.weixin.qq.com/s/I1aDAHSpW0bitxyn4XtIWg',
        }];
        break;
      case '星火论坛':
        reply = [{
          Title: '这个九月，Google大中华区总裁与你畅谈AI',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/xhlt.png',
          Url: 'https://mp.weixin.qq.com/s/UABbQH0IaEaVRN8Kez1LHg',
        },
        {
          Title: '星火前瞻 | 与霍金弟子加尔法德探索宇宙与未来——第143期星火论坛',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'https://mp.weixin.qq.com/s/nIlSql5RJtN7HFEjYqE9EA',
        },
        {
          Title: '星火在即 | 畅谈分子机器——与诺贝尔化学奖得主面对面',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'https://mp.weixin.qq.com/s/KwDEm64bHMjq2nkENDfSww',
        },
        ];
        break;
      case '燎原实践':
        reply = [{
          Title: '燎原实践 | 腾讯怎么知道我喜欢什么？',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/lysj.png',
          Url: 'https://mp.weixin.qq.com/s/1DSxC2NwnLwOGHZzN0ddfg',
        },
        {
          Title: '清华东门的神秘汪仔',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'https://mp.weixin.qq.com/s/8zt2HOfbm-w-VZpkf209ig',
        },
        ];
        break;
      case '学生学报':
        reply = [{
          Title: '征稿启事 | 更好的学报，期待投稿的你',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/xsxb.png',
          Url: 'https://mp.weixin.qq.com/s/Pp_oHLh6uBkpsGRefQmxug',
        },
        ];
        break;
      case '挑战杯':
        reply = [{
          Title: 'i 挑战 | 挑战杯校级终审 特奖获取指南',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/tzb.png',
          Url: 'https://mp.weixin.qq.com/s/YKuQFReLxmhm-DpBlRKxKQ',
        },
        {
          Title: '报名启动 | 第36届挑战杯发车啦！',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/small.png',
          Url: 'https://mp.weixin.qq.com/s/dur3o8gi67vmQBPWsMgXpw',
        },
        ];
        break;
      case '加入校科协':
        reply = [{
          Title: '科协招新 | 你的蛙今天去了哪里',
          Description: '',
          PicUrl: 'http://thusaishi.nogeek.cn/assets/zx.png',
          Url: 'https://mp.weixin.qq.com/s/bRoso9se2q8KpOuEIn-ZAg',
        }];
        break;
      case '[Smirk]': case '[OK]': case '[Whimper]': case '[可怜]':
        reply = '[Smirk]'.repeat((Math.random() * 6) + 1);
        break;
      case '[Trick]': case '[坏笑]':
        reply = '[Trick]'.repeat((Math.random() * 10) + 1);
        break;
      case '我要彩蛋[Smirk]':
        reply = '满足你！\nhttp://thusaishi.nogeek.cn/assets/cd-wxk.png';
        break;
      case '36届科协':
        reply = 'http://thusaishi.nogeek.cn/assets/cd-36kx.png';
        break;
      case '36届主席团':
        reply = 'http://thusaishi.nogeek.cn/assets/cd-36zx.png';
        break;
      case '36届主席团自拍':
        reply = 'http://thusaishi.nogeek.cn/assets/cd-36zxzp.png';
        break;
      default: // 默认回复：滑稽*random()
        // var defaultMsg=['[Smirk]']
        // reportMsg = msg.txtMsg(fromUser,toUser,defaultMsg[Math.floor(Math.random()*defaultMsg.length)]);
        reply = '科小协现在还听不懂你在说什么[Shy]\n感谢关注清华大学学生科协，我们会继续加油哒~';
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
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].length / max_len; i++) {
        arr_.push(arr[i].slice(j * max_len, (j + 1) * max_len));
      }
    }
    let msg_ = arr_[0];
    for (let i = 1; i < arr_.length; i++) {
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
};

class Wechat {
  constructor(config) {
    this.config = config;
    this.token = config.token;
    this.appID = config.appID;
    this.appSecret = config.appSecret;
    this.apiDomain = config.apiDomain;
    this.apiURL = config.apiURL;
    this.more = {};
  }

  async getAccessToken() {
    // 获取当前时间
    const currentTime = new Date().getTime();
    // 格式化请求地址
    const url = util.format(this.apiURL.accessTokenApi, this.appID, this.appSecret);
    // 判断 本地存储的 access_token 是否有效
    if (!accessTokenJson || accessTokenJson.access_token === '' || accessTokenJson.expires_time < currentTime) {
      const {
        data: result,
      } = await axios.get(url, { baseURL: this.apiDomain });
      if (!('errcode' in result)) {
        accessTokenJson = {
          access_token: result.access_token,
          expires_time: new Date().getTime() + ((parseInt(result.expires_in, 10) - 200) * 1000),
        };
        // 更新本地存储的
        // await writeFile('./access_token.json', JSON.stringify(accessTokenJson), 'utf-8');
        // 将获取后的 access_token 返回
        return accessTokenJson.access_token;
      }
      const err = new Error('Wrong');
      err.rawResult = result;
      throw err;
    }
    // 将本地存储的 access_token 返回
    return accessTokenJson.access_token;
  }

  async auth(req, res) {
    await this.getAccessToken();
    this.setMenu();

    // 1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
    const {
      signature,
      timestamp,
      nonce,
      echostr,
    } = req.query;

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
      res.status(403).send();
    }
  }

  handleMsg(req, res) {
    // 实例微信消息加解密
    const cryptoGraphy = new CryptoGraphy(this.config, req);

    // 监听 end 事件 用于处理接收完成的数据

    let result = req.body.xml;
    // console.log(result);

    // 判断消息加解密方式
    if (req.query.encrypt_type === 'aes') {
      // 对加密数据解密
      result = cryptoGraphy.decryptMsg(result.Encrypt);
    }
    const toUser = result.ToUserName; // 接收方微信
    const fromUser = result.FromUserName; // 发送仿微信
    let reportMsg; // 声明回复消息的变量

    // 判断消息类型
    console.log(`${getTime()}\nMsg[${result.MsgType}${result.Event ? `.${result.Event}` : ''}]\tfrom ${fromUser}\t->${result.Content}`);
    if (result.MsgType.toLowerCase() === 'event') {
      // 判断事件类型
      switch (result.Event.toLowerCase()) {
        case 'subscribe':
        { // 回复消息
          const content = '欢迎关注清华大学学生科协公众号，回复“赛事”可以查看赛事列表，回复“创意大赛”查看相关内容，回复其他内容获取专属滑稽[Smirk]。';
          reportMsg = msg.txtMsg(fromUser, toUser, content);
          break;
        }
        case 'click':
          reportMsg = getReply(fromUser, toUser, result.EventKey);
          break;
        default:
          reportMsg = '';
          break;
      }
    } else if (result.MsgType.toLowerCase() === 'text') {
      // 根据消息内容返回消息信息
      if (result.Content === 'more') {
        if (this.more[fromUser]) {
          reportMsg = this.more[fromUser];
        } else {
          reportMsg = msg.txtMsg(fromUser, toUser, '没有更多了[Concerned]');
        }
      } else {
        reportMsg = getReply(fromUser, toUser, result.Content);
      }
    }

    if (Array.isArray(reportMsg)) { // 判断是单条消息的string还是多条消息array
      if (reportMsg.length > 1) {
        this.more[fromUser] = reportMsg.slice(1);
        reportMsg = `${reportMsg[0]}\n.\n.\n.\n查看更多请输入 more`;
      } else {
        [reportMsg] = reportMsg;
        this.more[fromUser] = undefined;
      }
      reportMsg = msg.txtMsg(fromUser, toUser, reportMsg);
    }

    reportMsg = req.query.encrypt_type === 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg;
    res.send(reportMsg);
    console.log('-Replied.');
  }

  async setMenu() {
    const url = util.format(this.apiURL.createMenu, accessTokenJson.access_token);
    // 使用 Post 请求创建微信菜单
    const { data } = await axios({ url, method: 'post', data: menus, baseURL: this.apiDomain });
    console.log('setMenu: ', data);
  }
}

module.exports = Wechat;
