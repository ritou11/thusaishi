const _ = require('lodash');

/**
 * 回复文本消息
 * @param {String} toUser 接收用户
 * @param {String} fromUser 发送用户
 * @param {String}  content 发送消息
 */
exports.txtMsg = (toUser, fromUser, content) => {
  let xmlContent = `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName>`;
  xmlContent += `<FromUserName><![CDATA[${fromUser}]]></FromUserName>`;
  xmlContent += `<CreateTime>${new Date().getTime()}</CreateTime>`;
  xmlContent += '<MsgType><![CDATA[text]]></MsgType>';
  xmlContent += `<Content><![CDATA[${content}]]></Content></xml>`;
  return xmlContent;
};

/**
 * 回复文本消息
 * @param {String} toUser 接收用户
 * @param {String} fromUser 发送用户
 * @param {String}  mediaID 素材库中的图片ID
 */
exports.picMsg = (toUser, fromUser, mediaID) => {
  let xmlContent = `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName>`;
  xmlContent += `<FromUserName><![CDATA[${fromUser}]]></FromUserName>`;
  xmlContent += `<CreateTime>${new Date().getTime()}</CreateTime>`;
  xmlContent += '<MsgType><![CDATA[image]]></MsgType>';
  xmlContent += `<Content><![CDATA[${mediaID}]]></Content></xml>`;
  return xmlContent;
};


/**
 * 回复图文消息
 * @param {String} toUser 接收用户
 * @param {String} fromUser 发送用户
 * @param {Array}  contentArr 图文信息集合
 */
exports.graphicMsg = (toUser, fromUser, contentArr) => {
  let xmlContent = `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName>`;
  xmlContent += `<FromUserName><![CDATA[${fromUser}]]></FromUserName>`;
  xmlContent += `<CreateTime>${new Date().getTime()}</CreateTime>`;
  xmlContent += '<MsgType><![CDATA[news]]></MsgType>';
  xmlContent += `<ArticleCount>${contentArr.length}</ArticleCount>`;
  xmlContent += '<Articles>';
  _.forEach(contentArr, (item) => {
    xmlContent += '<item>';
    xmlContent += `<Title><![CDATA[${item.Title}]]></Title>`;
    xmlContent += `<Description><![CDATA[${item.Description}]]></Description>`;
    xmlContent += `<PicUrl><![CDATA[${item.PicUrl}]]></PicUrl>`;
    xmlContent += `<Url><![CDATA[${item.Url}]]></Url>`;
    xmlContent += '</item>';
  });
  xmlContent += '</Articles></xml>';
  return xmlContent;
};
