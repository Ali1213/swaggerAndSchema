const fs = require('fs')
const path = require('path')
const swaggerHTML = require('./swaggerHTML')
const Ajv = require('ajv')


const getAllJsonPathFromPath = function ({ apisDirPath } = {}) {
	const filenames = fs.readdirSync(apisDirPath)
	return filenames.map(filename => ({
		content: require(path.join(apisDirPath, filename)),
		name: path.basename(filename, path.extname(filename)),
	}))
}



function parseBody(body) {
	return {
		in: 'body',
		name: 'body',
		required: true,
		schema: body,
	}
}

function createSwaggerRouter({
	router,
	apiJsonPath,
	swaggerJson,
} = {}) {
	router.get(apiJsonPath, (_, res) => {
		res.setHeader('Content-Type', 'application/json')
		res.send(JSON.stringify(swaggerJson))
	})
}


/* 
 * 生成路由
 * return {undefined}
 */
function createApiJsonRouter({
	swaggerPagePath,
	router,
	apiJsonPath,
}) {

	router.get(swaggerPagePath, (_, res) => {
		res.setHeader('Content-Type', 'text/html')
		res.send(swaggerHTML(apiJsonPath))
	})
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


	// createSwaggerRouter({
	// 	router,
	// 	apiJsonPath,
	// 	swaggerPagePath,
	// 	swaggerJson,
	// })

	return swaggerJson
}

let schemaCache

// TODU 考虑 定义的模板 definitions 的情况
const getSchemas = ({ apiJsons } = {}) => {
	return apiJsons.reduce((prev, apiJson) => {
		prev[apiJson.name] = apiJson.content.body
		return prev
	}, {})
}

const startSwaggerReturnSchema = ({
	router,
	swagger = '2.0',
	version = '1.0.0',
	title = 'hegui-backend',
	description = 'hegui-backend后台API汇总',
	schemes = ['http'],
	host = 'localhost:4040',
	basePath = '/',
	// 符合swagger标准的json文件生成的url path
	apiJsonPath = '/api-docs.json',
	// swagger页面的 path
	swaggerPagePath = '/api-docs',
	apisDirPath = path.join(__dirname, '../../configs/apis'),
} = {}) => {
	const options = {
		router,
		swagger,
		version,
		title,
		description,
		schemes,
		host,
		basePath,
		apiJsonPath,
		// swagger页面的 path
		swaggerPagePath,
		apisDirPath,
	}

	options.apiJsons = getAllJsonPathFromPath(options)

	options.swaggerJson = apiJsonToSwaggerJson(options)
	createApiJsonRouter(options)
	createSwaggerRouter(options)
	schemaCache = getSchemas(options)
	return schemaCache
}


function validate(params, actionName) {
	let action = actionName || params.Action
	if(typeof action !== 'string'){
		return 'Action not found'
	}

	if(!schemaCache) throw Error('schema must be init')
	if(!schemaCache[action]) {
		return 'No Such Method'
	}

	let ajv = new Ajv()
	let valid = ajv.validate(schemaCache[action], params)
	let error
	if(!valid){
		error = JSON.stringify(ajv.errors)
	}
	return error
}

module.exports = startSwaggerReturnSchema
module.exports.apiJsonToSwaggerJson = apiJsonToSwaggerJson
module.exports.getSchemas = getSchemas
module.exports.createSwaggerRouter = createSwaggerRouter
module.exports.createApiJsonRouter = createApiJsonRouter
// module.exports.startSwaggerReturnSchema = startSwaggerReturnSchema
module.exports.validate = validate
