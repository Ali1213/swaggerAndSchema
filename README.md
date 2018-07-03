# 快速开始

引入项目

```javascript

// 建议放在router.js
const schema = require('./libs/swaggerAndSchema')

schema({ 
    // 必须传入路由，用于生成swagger
    router,
    // 示例:CONFIG.host + ':' + CONFIG.port, 用于展示swagger.json和swagger的文档
    host: '0.0.0.0' + ':' + '4040',
    // 需要传入apis/xxx.json 的 文件夹 路径
    apisDirPath: '',
})



// schema 效验

/* 
 * options 
 *      params 参数
 *      actionName? 默认使用params.Action
 * return {string| undefined}
 *      string 代表错误，未通过效验
 *      undefined 通过效验
 */
const error = schema.validate(params, actionName)

```