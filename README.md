## 安装

```
npm i swagger-and-schema --save
```

## 常见问题即解决方法

1. 在正式环境中没有端口号的概念，路由不对
    解决方法1： 在new new SwaggerAndSchema({host:xxx.com}), 
    解决方法2： 在 router.get(apiJsonPath, ss.genApiJsonRouter(CONFIG.port)) 不传入 port 参数

## 快速使用

### 使用schema效验

```javascript

const SwaggerAndSchema = require('swagger-and-schema')

const ss = new SwaggerAndSchema({
    // api.json文件夹所在地
    // 如果符合目前项目目录设置，则不需要设置该值
    apisDirPath: 'xxx',
})

// err为null时表示效验通过，否则则为数组，数组的每一项代表效验失败的结果
// const err = ss.validate(params) 

// 推荐下列方法
// @return {string | undefined} string代表错误提示，如果有多条，以;相连， undefined代表效验通过
const err = ss.check(params)

```


### 开启api文档

```javascript
const SwaggerAndSchema = require('swagger-and-schema')

var ss = new SwaggerAndSchema({
    apisDirPath: 'xxx',
    // api.json所在地
    // 示例: path.join(__dirname, 'configs/apis')
    // 如果符合目前项目目录设置，则不需要设置该值
})

const apiJsonPath = '/api-docs.json'
// 生成 json 文件的路径
// 由于express目前无法提供port，所以需要手动传入port
router.get(apiJsonPath, ss.genApiJsonRouter(CONFIG.port))
// 生成swaggerUI文件的路径
router.get('/api-docs', ss.genSwaggerRouter(apiJsonPath))
```

然后你就可以打开 项目路径，如`localhost:4040` + `/api-docs` 查看到swagger你的文档

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

const ss = new SwaggerAndSchema({
    // api.json文件夹所在地
    // 示例: path.join(__dirname, 'configs/apis')
    // 如果符合目前项目目录设置，则不需要设置该值
    apisDirPath: 'xxx',
})

const schema = ss.genSchema()
```



## 进阶

### components

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



## 更新


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