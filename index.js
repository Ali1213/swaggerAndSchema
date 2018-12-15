const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const yaml = require('js-yaml');
const swaggerHTML = require('./swaggerHTML');

/*
 * parse api.json
 * @params { object } body
 *
 * @returns { object } r
 * @returns { string }
 */
function parseBody(body) {
  if (!body) {
    return {
      in: 'body',
      name: 'body',
      required: false,
    };
  }
  if (!Array.isArray(body.required)) {
    body.required = [];
  }
  return {
    in: 'body',
    name: 'body',
    required: true,
    schema: body,
  };
}

const getSchemas = ({ apiJsons } = {}) => apiJsons.reduce((prev, apiJson) => {
  prev[apiJson.name] = apiJson.content.body || {
    required: [],
    properties: {},
  };
  return prev;
}, {});

const getAllJsonPathFromPath = ({ apisDirPath } = {}) => {
  const filenames = fs.readdirSync(apisDirPath);
  return filenames.map((filename) => {
    let content;
    const fileType = path.extname(filename);
    const filepath = path.join(apisDirPath, filename);
    if (fileType === '.json') {
      content = require(filepath);
    } else if (fileType === '.yaml') {
      content = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
    } else {
      content = {};
    }

    const name = content.name || path.basename(filename, path.extname(filename));
    return {
      content,
      name,
    };
  });
};

function apiJsonToSwaggerJson({
  swagger,
  version,
  title,
  description,
  schemes,
  host,
  basePath = '',
  apiJsons,
} = {}) {
  const swaggerJson = {
    swagger,
    info: {
      version,
      title,
      description,
    },
    schemes,
    host,
    basePath,
  };

  const paths = apiJsons.reduce((prev, { content, name }) => {
    // default 'Components.json' is a model file
    if (name == 'Components') {
      swaggerJson.Components = content;
      return prev;
    }
    const pathname = content.name || name;

    prev[`?Action=${pathname}`] = {
      post: {
        tags: content.tags,
        summary: content.summary || '',
        description: content.description || '',
        consumes: ['application/json'],
        produces: ['application/json'],
        parameters: [parseBody(content.body)], // 目前只支持body
        responses: content.responses || {
          200: {
            description: '请求成功',
          },
        },
      },
    };
    return prev;
  }, {});

  swaggerJson.paths = paths;
  return swaggerJson;
}

const _Validate = (params, actionName, schema) => {
  const action = actionName || params.Action;
  if (typeof action !== 'string') {
    return 'Action not found';
  }

  if (!schema) throw Error('schema must be init');
  if (!schema[action]) {
    return 'No Such Method';
  }

  const ajv = new Ajv();
  const valid = ajv.validate(schema[action], params);
  let error;
  if (!valid) {
    error = ajv.errors;
  }
  return error;
};

const _check = (params, actionName, schema) => {
  const action = actionName || params.Action;
  if (typeof action !== 'string') {
    return 'Action not found';
  }

  if (!schema) throw Error('schema must be init');
  if (!schema[action]) {
    return 'No Such Method';
  }

  const ajv = new Ajv();
  const valid = ajv.validate(schema[action], params);
  let err;
  if (!valid) {
    err = ajv.errors.map(item => item.message || '').join(';');
  }
  return err;
};

const _genSwaggerRouter = apiJsonPath => (_, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHTML(apiJsonPath));
};

class SwaggerAndSchema {
  constructor({
    swagger = '2.0',
    version = '1.0.0',
    title = '测试项目',
    description = '项目描述示例',
    schemes = ['http'],
    hostname,
    port,
    host,
    basePath = '',
    apiJsonPath,
    apisDirPath = path.join(__dirname, '../../configs/apis'),
  } = {}) {
    this.m = {
      swagger,
      version,
      title,
      description,
      schemes,
      hostname,
      host,
      port,
      basePath,
      apiJsonPath,
      apisDirPath,
      // 生成的apiJsons文件，同时用于生成swagger 和 schema效验
      // apiJsons,
      // 符合swagger规范的json文件
      // swaggerJson,
      // 符合schema效验的schema文件
      // scheme
    };
    if (hostname) {
      this.m.host = port ? `${hostname}:${port}` : hostname;
    }
  }

  validate(
    params,
    actionName,
    apisDirPath,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema(apisDirPath);

    return _Validate(params, actionName, this.m.scheme);
  }

  check(
    params,
    actionName,
    apisDirPath,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema(apisDirPath);

    return _check(params, actionName, this.m.scheme);
  }

  genApiJsons() {
    if (!Array.isArray(this.m.apiJsons)) {
      this.m.apiJsons = getAllJsonPathFromPath({ apisDirPath: this.m.apisDirPath });
    }
    return this.m.apiJsons;
  }

  genSchema() {
    if (typeof this.m.scheme !== 'object') {
      const apiJsons = this.genApiJsons(this.m.apisDirPath);
      this.m.scheme = getSchemas({ apiJsons });
    }
    return this.m.scheme;
  }

  genApiJsonRouter(port) {
    if (/^\d+$/.test(port)) {
      this.m.port = port;
    }

    return (req, res) => {
      this.m.hostname = this.m.hostname || req.hostname;
      if (!this.m.host) {
        this.m.host = this.m.port ? `${this.m.hostname}:${this.m.port}` : this.m.hostname;
      }

      if (typeof this.m.swaggerJson !== 'object') {
        this.genApiJsons();
        this.m.swaggerJson = apiJsonToSwaggerJson(this.m);
      }

      res.json(this.m.swaggerJson);
    };
  }

  genSwaggerRouter(apiJsonPath) {
    if (apiJsonPath) {
      this.m.apiJsonPath = apiJsonPath;
    }
    return _genSwaggerRouter(this.m.apiJsonPath);
  }
}

module.exports = SwaggerAndSchema;
module.exports.default = SwaggerAndSchema;
