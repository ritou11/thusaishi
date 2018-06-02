'use strict' //设置为严格模式

const crypto = require('crypto'), //引入加密模块
       https = require('https'), //引入 htts 模块
        util = require('util'), //引入 util 工具包
          fs = require('fs'), //引入 fs 模块
      urltil = require('url'),//引入 url 模块
accessTokenJson = require('./access_token'), //引入本地存储的 access_token
      menus  = require('./menus'), //引入微信菜单配置
 parseString = require('xml2js').parseString,//引入xml2js包
         msg = require('./msg'),//引入消息处理模块
CryptoGraphy = require('./cryptoGraphy'), //微信消息加解密模块
rh=require('./path'),
root=rh.root,
saishi_list=require(root+'contest_list.json'),
host=rh.host,
exec=require('child_process').exec,
spawn=require('child_process').spawn;

/**
 * 构建 WeChat 对象 即 js中 函数就是对象
 * @param {JSON} config 微信配置文件 
 */
var WeChat = function(config){
    //设置 WeChat 对象属性 config
    this.config = config;
    //设置 WeChat 对象属性 token
    this.token = config.token;
    //设置 WeChat 对象属性 appID
    this.appID = config.appID;
    //设置 WeChat 对象属性 appSecret
    this.appSecret = config.appSecret;
    //设置 WeChat 对象属性 apiDomain
    this.apiDomain = config.apiDomain;
    //设置 WeChat 对象属性 apiURL
    this.apiURL = config.apiURL;

    this.more={};//用于处理分块消息
    /**
     * 用于处理 https Get请求方法
     * @param {String} url 请求地址 
     */
    this.requestGet = function(url){
        return new Promise(function(resolve,reject){
            https.get(url,function(res){
                var buffer = [],result = "";
                //监听 data 事件
                res.on('data',function(data){
                    buffer.push(data);
                });
                //监听 数据传输完成事件
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    //将最后结果返回
                    resolve(result);
                });
            }).on('error',function(err){
                reject(err);
            });
        });
    }

    /**
     * 用于处理 https Post请求方法
     * @param {String} url  请求地址
     * @param {JSON} data 提交的数据
     */
    this.requestPost = function(url,data){
        return new Promise(function(resolve,reject){
            //解析 url 地址
            var urlData = urltil.parse(url);
            //设置 https.request  options 传入的参数对象
            var options={
                //目标主机地址
                hostname: urlData.hostname, 
                //目标地址 
                path: urlData.path,
                //请求方法
                method: 'POST',
                //头部协议
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data,'utf-8')
                }
            };
            var req = https.request(options,function(res){
                var buffer = [],result = '';
                //用于监听 data 事件 接收数据
                res.on('data',function(data){
                    buffer.push(data);
                });
                 //用于监听 end 事件 完成数据的接收
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    resolve(result);
                })
            })
            //监听错误事件
            .on('error',function(err){
                console.log(err);
                reject(err);
            });
            //传入数据
            req.write(data);
            req.end();
        });
    }
}

/**
 * 微信接入验证
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.auth = function(req,res){

    var that = this;
    this.getAccessToken().then(function(data){
        that.setMenu();
    });

    //1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
    var signature = req.query.signature,//微信加密签名
        timestamp = req.query.timestamp,//时间戳
            nonce = req.query.nonce,//随机数
        echostr = req.query.echostr;//随机字符串

    //2.将token、timestamp、nonce三个参数进行字典序排序
    var array = [this.token,timestamp,nonce];
    array.sort();

    //3.将三个参数字符串拼接成一个字符串进行sha1加密
    var tempStr = array.join('');
    const hashCode = crypto.createHash('sha1'); //创建加密类型 
    var resultCode = hashCode.update(tempStr,'utf8').digest('hex'); //对传入的字符串进行加密

    //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if(resultCode === signature){
        res.send(echostr);
    }else{
        res.send('mismatch');
    }
}

/**
 * 获取微信 access_token
 */
WeChat.prototype.getAccessToken = function(){
    var that = this;
    return new Promise(function(resolve,reject){
        //获取当前时间 
        var currentTime = new Date().getTime();
        //格式化请求地址
        var url = util.format(that.apiURL.accessTokenApi,that.apiDomain,that.appID,that.appSecret);
        //判断 本地存储的 access_token 是否有效
        if(accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime){
            that.requestGet(url).then(function(data){
                var result = JSON.parse(data); 
                if(data.indexOf("errcode") < 0){
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                    //更新本地存储的
                    fs.writeFile(root+'wechat/access_token.json',JSON.stringify(accessTokenJson));
                    //将获取后的 access_token 返回
                    resolve(accessTokenJson.access_token);
                }else{
                    //将错误返回
                    resolve(result);
                } 
            });
        }else{
            //将本地存储的 access_token 返回
            resolve(accessTokenJson.access_token);  
        }
    });
}

/**
 * 微信消息处理
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.handleMsg = function(req,res){
    var buffer = [],that = this;

    //实例微信消息加解密
    var cryptoGraphy = new CryptoGraphy(that.config,req);

    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        //解析xml
        parseString(msgXml,{explicitArray : false},function(err,result){
            if(!err){
                result = result.xml;
                //判断消息加解密方式
                if(req.query.encrypt_type == 'aes'){
                    //对加密数据解密
                    result = cryptoGraphy.decryptMsg(result.Encrypt);
                }
                var toUser = result.ToUserName; //接收方微信
                var fromUser = result.FromUserName;//发送仿微信
                var reportMsg = ""; //声明回复消息的变量   

                //判断消息类型
                console.log(that.getTime()+'\nMsg['+result.MsgType+(result.Event?'.'+result.Event:'')+']\tfrom '+fromUser+'\t->'+result.Content)
                if(result.MsgType.toLowerCase() === "event"){
                    //判断事件类型
                    switch(result.Event.toLowerCase()){
                        case 'subscribe':
                            //回复消息
                            var content = "欢迎关注清华大学校科协赛事部公众号(测试版)，回复“赛事”可以查看赛事列表，回复“创意大赛”查看相关内容，回复其他内容获取专属滑稽[Smirk]。";
                            reportMsg = msg.txtMsg(fromUser,toUser,content);
                        break;
                        case 'click':
                            reportMsg = that.getReply(fromUser,toUser,result.EventKey);
                        break;
                    }
                }else{
                     //判断消息类型为 文本消息
                    if(result.MsgType.toLowerCase() === "text"){
                        //根据消息内容返回消息信息
                        if(result.Content==='more'){
                            if(that.more[fromUser]){
                                reportMsg=that.more[fromUser]
                            }else{
                                reportMsg=msg.txtMsg(fromUser,toUser,'没有更多了[Concerned]')
                            }
                        }else{
                            reportMsg = that.getReply(fromUser,toUser,result.Content);
                        }
                    }
                }
                if(typeof reportMsg==='object'){//判断是单条消息的string还是多条消息array
                    if(reportMsg.length>1){
                        that.more[fromUser]=reportMsg.slice(1);
                        reportMsg=reportMsg[0]+'\n.\n.\n.\n查看更多请输入 more';
                    }else{
                        reportMsg=reportMsg[0];
                        that.more[fromUser]=undefined;
                    }
                    reportMsg=msg.txtMsg(fromUser,toUser,reportMsg);
                }
                reportMsg = req.query.encrypt_type == 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg ;
                res.send(reportMsg);
                console.log('-Replied.');
            }else{
                //打印错误
                console.log(err);
            }
        });
    });
}

WeChat.prototype.getReply=function(fromUser,toUser,content,res=undefined){
    var reply;
    var replied=false;
    for(var i=1;i<=saishi_list.length;i++){
        if(content==='sh'+i){
            reply=[
                {Title:saishi_list[content]+" ",Description:"赛事详情",PicUrl:"https://cloud.tsinghua.edu.cn/f/dc712a0588344a879de9/?dl=1",
                Url:host+'saishi?no='+i}
            ];
            replied=true;
        }
    }
    if(!replied){
        switch(content){
            case '赛事':
                reply='赛事列表：(回复对应代码查看详情)\n'+saishi_list.list
            break;
            case '创意大赛':
                reply=[
                    {Title:"创意大赛",Description:"",PicUrl:"https://cloud.tsinghua.edu.cn/f/1415ad6a77f04ff295c9/?dl=1",
                        Url:"https://mp.weixin.qq.com/s/twhKqjK_aBDyuxB9nmX3IA"},
                    {Title:"新闻稿",Description:"",
                        Url:"http://news.tsinghua.edu.cn/publish/thunews/10303/2018/20180524110451627595360/20180524110451627595360_.html?from=singlemessage&isappinstalled=0"}
                ];
            break;
            case '挑战杯':
                reply=[
                    {Title:"挑战杯终审",Description:"",PicUrl:"https://mmbiz.qpic.cn/mmbiz_jpg/SVtYAMekLSjQffKSSfh8mkDvOpRatgZQGzDqd9mZRF7M3TmAjlSkjNxTEBxEgf1bYgibNWA8vwEqicQs6aia60VYg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1",
                        Url:"https://mp.weixin.qq.com/s/YKuQFReLxmhm-DpBlRKxKQ"},
                    {Title:"挑战杯启动推送",Description:"",
                        Url:"https://mp.weixin.qq.com/s/dur3o8gi67vmQBPWsMgXpw"}                        
                ];
            break;
            case '加入校科协':
                reply=[
                    {Title:"—— Come Join Us ——",Description:"",PicUrl:"https://mmbiz.qpic.cn/mmbiz_jpg/SVtYAMekLSiajbmliagDdhpVhFKbhag2BAmuxeZicCoiadWDohRsK8rO3we4rQiboicaZc3LScYSLQVUaMpyDl9VOFpw/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1",
                        Url:"https://mp.weixin.qq.com/s/bRoso9se2q8KpOuEIn-ZAg"}
                ];
            break;
            default://默认回复：滑稽*random()
                // var defaultMsg=['[Smirk]']
                // reportMsg = msg.txtMsg(fromUser,toUser,defaultMsg[Math.floor(Math.random()*defaultMsg.length)]);
                var hj='[Smirk]';
                reply='';
                var repeat=Math.random()*6+1
                for(var i=0;i<repeat;i++){
                    reply+=hj;
                }
            break;
        }
    }
    if(typeof reply!=='string'){
        return msg.graphicMsg(fromUser,toUser,reply);
    }else{
        const max_len=800;
        if(reply.length>max_len){
            var arr=reply.split('\n');
            var arr_=[],arr__=[];
            for(var i=0;i<arr.length;i++){
                for(var j=0;j<arr[i].length/max_len;i++){
                    arr_.push(arr[i].slice(j*max_len,(j+1)*max_len))
                }
            }
            var msg_=arr_[0];
            for(var i=1;i<arr_.length;i++){
                if(msg_.length+arr_[i].length<=max_len){
                    msg_+='\n'+arr_[i];
                }else{
                    arr__.push(msg_);
                    msg_=arr_[i];
                }
            }
            arr__.push(msg_);
            return arr__;
        }else{
            return msg.txtMsg(fromUser,toUser,reply);
        }
    }
}

WeChat.prototype.setMenu=function(){
    var that=this;
    var url = util.format(that.apiURL.createMenu,that.apiDomain,accessTokenJson.access_token);
    //使用 Post 请求创建微信菜单
    that.requestPost(url,JSON.stringify(menus)).then(function(data){
        console.log('Set Menu',data);
    });
}

WeChat.prototype.getData=function(num,res){
    var that=this;
    console.log(that.getTime()+' Query',num)
    for(var i=1;i<=saishi_list.length;i++){
        if(num===''+i){
            //如果访问人数较多，应使用时间戳，防止访问冲突
            // var filename='res_'+Date.now()+'.html';
            var filename=root+'res_tmp/res_any.html';
            exec('cd '+root+'&&python3.5 '+root+'database.py '+num+' '+filename,function(err,stdout,stderr){
                console.log('Returned.'+stderr.toString())
                res.sendFile(filename);
            })
        }
    }
    // var job=spawn('python3.5',[root+'database.py',num,filename])
    // job.on('exit',function(code,signal){
    //     console.log('Returned.')
    //     res.sendFile(filename);
    // })
    // job.stderr.on('data',function(data){
    //     console.log('stderr:',data.toString());
    // })
}

WeChat.prototype.getTime=function(){
    var now=new Date();
    return now.toLocaleDateString()+' '+now.toLocaleTimeString();
}
//暴露可供外部访问的接口
module.exports = WeChat;
