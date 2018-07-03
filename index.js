const fs = require('fs')
const path = require('path')
const swaggerHTML = require('./swaggerHTML')
const Ajv = require('ajv')


const getAllJsonPathFromPath = function ({ apisDirPath } = {}) {
    const filenames = fs.readdirSync(apisDirPath)
    return filenames.map(filename => {
        let content = require(path.join(apisDirPath, filename));
        let name = content.name || path.basename(filename, path.extname(filename))
        return {
            content,
            name,
        }
    })
}



function parseBody(body) {
    if (!Array.isArray(body.required)) {
        body.required = [];
    }
    return {
        in: 'body',
        name: 'body',
        required: true,
        schema: body,
    }
}

const apiJsonToSwaggerJson = function ({
    swagger = '2.0',
    version = '1.0.0',
    title = 'hegui-backend',
    description = 'hegui-backend后台API汇总',
    schemes = ['http'],
    host = 'localhost:4040',
    basePath = '',
    apiJsons,
} = {}) {
    let swaggerJson = {
        swagger,
        info: {
            version,
            title,
            description,
        },
        schemes,
        host,
        basePath,
    }

    let paths = apiJsons.reduce((prev, { content, name }) => {
        // if(name !== 'GetBatchList') return prev
        if (name == 'Components') {
            swaggerJson['Components'] = content
            return prev
        }
        let pathname = content.name || name

        prev[`?Action=${pathname}`] = {
            'post': {
                tags: content.tags,
                summary: content.summary || '',
                description: content.description || '',
                consumes: ['application/json'],
                produces: ['application/json'],
                parameters: [parseBody(content.body)], //目前只支持body
                responses: content.responses || {
                    200: {
                        description: '请求成功'
                    }
                }
            }
        }
        return prev
    }, {})

    swaggerJson.paths = paths
    return swaggerJson
}


// TODU 考虑 定义的模板 definitions 的情况
const getSchemas = ({ apiJsons } = {}) => {
    return apiJsons.reduce((prev, apiJson) => {
        prev[apiJson.name] = apiJson.content.body
        return prev
    }, {})
}

const apiJsonRouter = (port) => {
    if (typeof port == 'string') {
        return apiJsonRouterInner({ port })
    } else if (typeof port === 'object') {
        return apiJsonRouterInner(port)
    }else{
        throw Error('Port must be a string or an Object')
    }
}


const apiJsonRouterInner = ({
    swagger = '2.0',
    version = '1.0.0',
    title = 'hegui-backend',
    description = 'hegui-backend后台API汇总',
    schemes = ['http'],
    hostname,
    port,
    basePath = '/',
    // 符合swagger标准的json文件生成的url path
    apiJsonPath,
    // swagger页面的 path
    // swaggerPagePath = '/api-docs',
    apisDirPath = path.join(__dirname, '../../configs/apis'),
} = {}) => {
    if (typeof port !== 'string') throw Error('Port must be a number')
    return (req, res) => {
        const options = {
            swagger,
            version,
            title,
            description,
            schemes,
            host: `${hostname || req.hostname}:${port}`,
            basePath,
            apiJsonPath: apiJsonPath || req.originalUrl,
            apisDirPath,
        }

        options.apiJsons = getAllJsonPathFromPath(options)

        options.swaggerJson = apiJsonToSwaggerJson(options)


        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify(options.swaggerJson))
    }

}

const swaggerRouter = (args) => {
    let apiJsonPath
    if (typeof args === 'string') {
        apiJsonPath = args
    } else {
        ({ apiJsonPath } = args)
    }
    return (_, res) => {
        res.setHeader('Content-Type', 'text/html')
        res.send(swaggerHTML(apiJsonPath))
    }
}


const genValidate = ({
    apisDirPath = path.join(__dirname, '../../configs/apis'),
} = {}) => {
    validate.schema = genSchema({ apisDirPath })

    return validate
    function validate(params, actionName) {
        let action = actionName || params.Action
        if (typeof action !== 'string') {
            return 'Action not found'
        }

        if (!schema) throw Error('schema must be init')
        if (!schema[action]) {
            return 'No Such Method'
        }

        let ajv = new Ajv()
        let valid = ajv.validate(schema[action], params)
        let error
        if (!valid) {
            error = JSON.stringify(ajv.errors)
        }
        return error
    }
}

const genValidate = ({
    apisDirPath = path.join(__dirname, '../../configs/apis'),
} = {}) => {
    const apiJsons = getAllJsonPathFromPath({ apisDirPath })
    const schema = getSchemas({ apiJsons })
    validate.schema = schema

    return validate
    function validate(params, actionName) {
        let action = actionName || params.Action
        if (typeof action !== 'string') {
            return 'Action not found'
        }

        if (!schema) throw Error('schema must be init')
        if (!schema[action]) {
            return 'No Such Method'
        }

        let ajv = new Ajv()
        let valid = ajv.validate(schema[action], params)
        let error
        if (!valid) {
            error = JSON.stringify(ajv.errors)
        }
        return error
    }
}


const genSchema = ({
    apisDirPath = path.join(__dirname, '../../configs/apis'),
} = {}) => {
    const apiJsons = getAllJsonPathFromPath({ apisDirPath })
    const schema = getSchemas({ apiJsons })

    return schema
}

module.exports.apiJsonRouter = apiJsonRouter
module.exports.swaggerRouter = swaggerRouter
module.exports.genValidate = genValidate
module.exports.genSchema = genSchema