## 安装

```
npm i swagger-and-schema --save
```

## 快速使用

### 使用schema效验

```javascript

const { genValidate } = require('swagger-and-schema')

const validate = genValidate()

// error为null时表示效验通过，否则则为字符串
const error = validate(params)

```

### 获取schema

```javascript

// method 1
const { genValidate } = require('swagger-and-schema')
const schema = genValidate().schema

// method 2
const { genSchema } = require('swagger-and-schema')
const schema = genSchema()

```

### 开启api文档

```javascript

const {
	apiJsonRouter,
	swaggerRouter,
} = require('swagger-and-schema')

const jsonPath = '/api-docs.json'
// 生成 json 文件的路径
router.get(jsonPath, apiJsonRouter(CONFIG.port))
// 生成swaggerUI文件的路径
router.get('/api-docs', swaggerRouter(jsonPath))
```

### api参数
