## 安装

```
npm i swagger-and-schema --save
```

## 简单介绍

这个包是集成了两个功能

+ swagger文档生成，可以方便的通过url访问
+ 集成了接口输入和输出的效验功能

ps: 输入和输出参数效验必须是json

## 环境要求

node.js
+ v6.0以上

## 快速使用

### 使用schema效验

### 使用schema效验输入参数

```javascript

const SwaggerAndSchema = require('swagger-and-schema')

// default: 当前项目下`configs/apis`
// 如果不是该路径，则需传入参数`{apisDirPath: 'api的文件所在目录'}`
const ss = new SwaggerAndSchema()

/** 
 * @params { Object } params 需要效验的参数对象
 * @params { string? } actionName 默认值为params.Action; 本次请求的指定接口名称
 * @return {string | undefined} string代表错误提示，undefined代表效验通过
 */
const err = ss.check(params, actionName)

```


### 使用schema效验输出参数

```javascript

const SwaggerAndSchema = require('swagger-and-schema')

// default: 当前项目下`configs/apis`
// 如果不是该路径，则需传入参数`{apisDirPath: 'api的文件所在目录'}`
const ss = new SwaggerAndSchema()



/** 
 * @params { Object } params 需要效验的参数对象
 * @params { string? } actionName 默认值为params.Action; 本次请求的指定接口名称
 * @return {string | undefined} string代表错误提示，undefined代表效验通过
 */
const err = ss.checkOutput(params, actionName)
```

### 开启api文档

```javascript
const SwaggerAndSchema = require('swagger-and-schema')

// default: 当前项目下`configs/apis`
// 如果不是该路径，则需传入参数`{apisDirPath: 'api的文件所在目录'}`
var ss = new SwaggerAndSchema()

const apiJsonPath = '/api-docs.json'
// 生成 json 文件的路径
// 由于express目前无法提供port，所以需要手动传入port
router.get(apiJsonPath, ss.genApiJsonRouter(CONFIG.port))
// 生成swaggerUI文件的路径
router.get('/api-docs', ss.genSwaggerRouter(apiJsonPath))
```

然后你就可以打开 项目路径，如`localhost:4040` + `/api-docs` 查看到swagger你的文档(请将端口号换成你自己的)

### api/json示例


友情提示 copy的话请去除注释

```json
{
  "tags": [
    "公安备案通知"
  ],
  "summary": "获取批次列表",
  "description": "获取用户上传文件的文件列表",
  "body": {
    "required": [
        "Domain"
    ],
    "properties": {
      "Domain": {
        "type": "string",
        "description": "域名"
      },
      "BeginTime": {
        "type": "integer",
        "description": "起始时间",
        "maxLength": 10,
        "minLength": 10
      },
      "EndTime": {
        "type": "integer",
        "description": "截止时间",
        "maxLength": 10,
        "minLength": 10
      },
      "Page": {
        "type": "integer",
        "description": "获取的页码，从0开始计数",
        "default": 0
      },
      "Limit": {
        "type": "integer",
        "description": "每页显示的条目数",
        "default": 20
      }
    }
  },
  "responses": {
    "200": {
      "description": "",
      "schema": {
        "type": "object",
        "properties": {
          "Count": {
            "type": "integer"
          },
          "List": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "Id": {
                  "type": "integer"
                },
                "Description": {
                  "type": "string"
                },
                "CreateTime": {
                  "type": "integer"
                },
                "Type": {
                  "type": "integer"
                },
                "Status": {
                  "type": "integer"
                },
                "Operator": {
                  "type": "string"
                }
              }
            }
          },
          "RetCode": {
            "type": "integer"
          }
        }
      }
    }
  }
}
```


### 如果需要获取schema（暂时没有人需要这个需求）

```javascript
const SwaggerAndSchema = require('swagger-and-schema')

// default: 当前项目下`configs/apis`
// 如果不是该路径，则需传入参数`{apisDirPath: 'api的文件所在目录'}`
const ss = new SwaggerAndSchema()

// 获取入参效验的schema文件
const schema = ss.genSchema()

// 获取出参效验的schema文件
const schema = ss.genSchema('output')

```



## 进阶

### `SwaggerAndSchema`类的参数详解

在新建实例的时候`new SwaggerAndSchema(params)`,params对象有多个属性值
+ `swagger` swagger版本号,目前仅作为页面展示的作用
+ `version` api版本号，swagger官方文档是有多版本api文档的概念的，不过暂不支持，目前仅作为页面展示的作用
+ `title` 项目名称，页面展示的作用
+ `description` 项目描述，页面展示的作用
+ `hostname` hostname， *可能会在后续版本改动*
+ `port` 端口号: 项目启动的端口号, 推荐使用genApiJsonRouter(port)传入，*可能会在后续版本改动*
+ `title` 项目名称，页面展示的作用
+ `apiJsonPath` api路径，默认路径为`${当前项目路径}/configs/apis`
+ `needPrex` 是否需要前缀, 默认值为false, 详见api文档多层嵌套
+ `seq` 分隔符，windows系统默认为`\`, linux系统默认为`/`，详见api文档多层嵌套

### components文件

如果多个api的出参是一致的，每个api文档都写一遍是很烦人的，所以你需要用到公共文档

目前版本代码是写死的,在`apis/Components.yaml` 或者是 `Components.json`文件中可以定义一些公共可复用的组件。

举个例子：有很多借口的返回值只需要一个RetCode为0

可以在`apis/Components.yaml`加上如下的代码

```yaml
responseRetCodeOnly:
  schema:
    type: object
    properties:
      RetCode:
        type: integer
        default: 0
        description: 当RetCode为0时，代表该操作执行成功
```

在你的`apis/****.yaml`文档中可以如下引用

```yaml
tags:
  - 新版QQ群
summary: 修改单条群相关信息
description: 修改单条群相关信息
body:
  required:
    - Id
  properties:
    Id:
      type: string
      description: id
responses:
  '200':
    $ref: '#/Components/responseRetCodeOnly'
```

有关比如返回公司信息，返回资源信息等的模板我已经写好了，可以不用复写，@我就好


### api文档多层嵌套

目前的项目支持apis路径下有文档多层嵌套

比如`apiJsonPath`为`configs/apis`,

您可以使用`configs/api/v1/`放置v1版本的接口

项目会去自动读取`configs/api`文件夹及其后代文件夹中所有的yaml和json文件

读取完成之后，程序会在内存给每个转化完成的json文件一个唯一的`actionName`

默认情况使用yaml或json文件中的属性`name`作为`actionName`如果没有，则以文件名作为`actionName`

那么可能存在的问题
```
// 假设存在的文件名如下，就会出现冲突

configs/api/v1/aaa.yaml
configs/api/v2/aaa.yaml
```

所以引入了相关的配置属性

默认:

+ configs/api/v1/aaa.yaml  -> `actionName`为`aaa`

当`needPrex`设置为true时:

+ configs/api/v1/aaa.yaml  -> `actionName`为`v1/aaa`

当`needPrex`设置为true时,并且`seq`为`-`:

+ configs/api/v1/aaa.yaml  -> `actionName`为`v1-aaa`


## 老项目迁移


将如下的代码copy到项目的scripts/目录下（其他的目录可能需要修改下路径，因为路径是写死的）

最后将生成的configs/apiDocs
稍微检查无误后
文件夹更名为 configs/apis

```
/* 
 * 把原项目的apis文件夹内json转成 新的swagger的json格式
 * 路径目前是写死的
 * @author by ali.yu
*/
/*
 * 把原项目的apis文件夹内json转成 新的swagger的json格式
 * 路径目前是写死的
 * @author by ali.yu
*/

const fs = require('fs');
const path = require('path');


const getAllJsonPathFromPath = function (dirPath) {
	const filenames = fs.readdirSync(dirPath);
	return filenames.map(filename => ({
		content: require(path.join(dirPath, filename)),
		name: path.basename(filename, path.extname(filename)),
	}));
};
const apiObj = getAllJsonPathFromPath(path.join(__dirname, '../configs/apis'));

fs.mkdirSync(path.join(__dirname, '../configs/apiDocs'));
apiObj.forEach(({
	content,
	name,
}) => {
	let tags = content.tags,
		summary = content.summary || '',
		description = content.description || '',
		body = content.input;

	delete content.input;

	const required = [];
	const properties = {};
	const result = {
		...content,
		tags,
		summary,
		description,
		body: {
			required,
			properties,
		},
	};

	body.forEach((item) => {
		properties[item.name] = {
		};
		switch (item.type) {
			case 'int':
				properties[item.name].type = 'integer';
				break;
			case 'array':
				properties[item.name].type = 'array';
				if (item.arrType === 'int') {
					properties[item.name].items = {
						type: 'integer',
					};
				} else if (item.arrType === 'string') {
					properties[item.name].items = {
						type: 'string',
					};
				}
				break;
			case 'string':
			default:
				properties[item.name].type = 'string';
		}

		properties[item.name].description = item.description || '';
		if (item.required) {
			required.push(item.name);
		}
	});
	fs.writeFileSync(path.join(__dirname, '../configs/apiDocs', `${name}.json`), JSON.stringify(result, null, 2));
});

```

## 使用小贴士

### com


## 常见问题即解决方法

1. 在正式环境中没有端口号的概念，路由不对
+ 解决方法1： 在new new SwaggerAndSchema({host:xxx.com})
+ 解决方法2： 在 router.get(apiJsonPath, ss.genApiJsonRouter(CONFIG.port)) 不传入 port 参数



## 更新


### 2018.12.15 v1.5.0

+ feature: 提供对输出参数效验的方法.
+ fixed: 公用组件Components的一些问题

### 2018.12.15 v1.4.6

+ feature: 支持api文件夹中有子文件夹的情况.
+ ajust: 项目中eslint的风格从google调整为airbnb

### 2018.12.07 v1.4.3

+ add: 增加check方法，返回字符串或者undefined，如果是空字符串就是无错误消息，如果是有内容的字符串，就是错误信息，以;为分隔符串联

### 2018.12.07 v1.4.2

+ fixed: 修复body在没有的情况下schema效验的报错

### 2018.12.06 v1.4.1

+ fixed: body没有的情况下的swagger的报错

### 2018.10.5 v1.4.0

+ 增加ts声明
+ hack一下，增加default属性

### 2018.10.5 v1.3.0

+ 支持yaml格式的api.json文档