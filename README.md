## 安装

```
npm i swagger-and-schema --save
```

## 快速使用



### 使用schema效验

```javascript

const SwaggerAndSchema = require('swagger-and-schema')

var ss = new SwaggerAndSchema({
    apisDirPath: 'xxx',
    // api.json所在地
    // 如果符合目前项目目录设置，则不需要设置该值
})

// error为null时表示效验通过，否则则为字符串
const error = ss.validate(params)

```

### 获取schema

```javascript
const SwaggerAndSchema = require('swagger-and-schema')

var ss = new SwaggerAndSchema({
    apisDirPath: 'xxx',
    // api.json所在地
    // 如果符合目前项目目录设置，则不需要设置该值
})

const schema = ss.genSchema()
```

### 开启api文档

```javascript
const SwaggerAndSchema = require('swagger-and-schema')

var ss = new SwaggerAndSchema({
    apisDirPath: 'xxx',
    // api.json所在地
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
整个json里面，必须存在的字段是body
body里面，必须存在的字段是 properties
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


## 旧版本的schema 如何转换到新版本

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