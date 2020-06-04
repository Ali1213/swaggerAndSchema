/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const path = require('path');
const Ajv = require('ajv');
const swaggerHTML = require('./libs/swaggerHTML');

const {
  importFilesFromPath,
  // genInputSchemas,
  genAjvSchemas,
  genOutPutAjvSchemas,
  // genOutPutSchemas,
} = require('./libs/utils');


function parseReqBody(body) {
  if (!body) {
    return {
      required: false,
    };
  }
  if (!Array.isArray(body.required)) {
    body.required = [];
  }
  return {
    required: true,
    content: {
      'application/json': {
        schema: body,
      },
    },
  };
}


function parseResBody(response) {
  return Object.keys(response).reduce((prev, value) => {
    const resSchema = response[value].schema || {};
    delete response[value].schema;
    prev[value] = {
      content: {
        'application/json': {
          schema: resSchema,
        },
      },
      ...response[value],
    };
    return prev;
  }, {});
}


function apiJsonToSwaggerJson({
  openapi,
  version,
  title,
  description,
  schemes,
  host,
  basePath = '',
  apiJsons,
} = {}) {
  const swaggerJson = {
    openapi,
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
    if (name === 'Components') {
      swaggerJson.Components = content;
      return prev;
    }
    const pathname = content.name || name;

    prev[`?Action=${pathname}`] = {
      post: {
        tags: content.tags,
        summary: content.summary || '',
        description: content.description || '',
        // consumes: ['application/json'],
        // produces: ['application/json'],
        // parameters: [parseBody(content.body)], // 目前只支持body
        requestBody: parseReqBody(content.body),
        responses: parseResBody(content.responses || {
          200: {
            description: '请求成功',
          },
        }),
      },
    };
    return prev;
  }, {});

  swaggerJson.paths = paths;
  return swaggerJson;
}

const _Validate = (params, actionName, ajv) => {
  const action = actionName || params.Action;
  if (typeof action !== 'string') {
    return 'Action not found';
  }

  const valid = ajv.validate(action, params);
  let error;
  if (!valid) {
    error = ajv.errors;
  }
  return error;
};


const _ValidateConvert = (params, actionName, schemas, ajv, convertParams = function () { }) => {
  const action = actionName || params.Action;
  if (typeof action !== 'string') {
    return 'Action not found';
  }

  let content = schemas.find(item => item.name === action);


  if (content) {
    content = content.content.body;
  }

  convertParams(params, content);

  const valid = ajv.validate(action, params);
  let error;
  if (!valid) {
    error = ajv.errors;
  }
  return error;
};

const _check = (params, actionName, ajv) => {
  const action = actionName || params.Action;
  if (typeof action !== 'string') {
    return 'Action not found';
  }
  const valid = ajv.validate(action, params);
  let err;
  if (!valid) {
    err = ajv.errorsText();
  }
  return err;
};

const _genSwaggerRouter = (apiJsonPath, htmlTitle) => (_, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHTML(apiJsonPath, htmlTitle));
};

class SwaggerAndSchema {
  constructor({
    openapi = '3.0.0',
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
    needPrex,
    seq,
    htmlTitle,
  } = {}) {
    this.m = {
      openapi,
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
      needPrex,
      seq,
      htmlTitle,
      //   defaultSchemas,
      // 生成的apiJsons文件，同时用于生成swagger 和 schema效验
      // apiJsons,
      // 符合swagger规范的json文件
      // swaggerJson,
      // 符合schema效验的schema对象 api效验
      // inputschema,
      // 符合schema效验的schema对象，输出效验
      // outputschema

      // 挂载ajv对象
      // inputAjv
      // outputAjv
    };
    if (hostname) {
      this.m.host = port ? `${hostname}:${port}` : hostname;
    }
  }

  validateWithHook(
    params,
    actionName,
    apisDirPath,
    convertParams,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema();
    return _ValidateConvert(params, actionName, this.m.inputschema, this.m.inputAjv, convertParams);
  }

  validate(
    params,
    actionName,
    apisDirPath,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema();

    return _Validate(params, actionName, this.m.inputAjv);
  }

  check(
    params,
    actionName,
    apisDirPath,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema();
    return _check(params, actionName, this.m.inputAjv);
  }

  /**
   * @checkOutput 检查输出的参数
   *
   */
  checkOutput(
    params,
    actionName,
    apisDirPath,
  ) {
    if (apisDirPath) {
      this.apisDirPath = apisDirPath;
    }

    this.genSchema('output');

    return _check(params, actionName, this.m.outputAjv);
  }

  genApiJsons() {
    if (!Array.isArray(this.m.apiJsons)) {
      this.m.apiJsons = importFilesFromPath({
        dirpath: this.m.apisDirPath,
        needPrex: this.m.needPrex,
        seq: this.m.seq,
      });
    }
    return this.m.apiJsons;
  }

  /**
   * @genSchema 生成schema文件
   * 通常来说， 生成这种文件就是需要进行schema效验
   * 所以在这一步进行ajv的加载
   *
   */
  genSchema(type = 'input') {
    if (type === 'input') {
      if (!this.m.inputAjv) {
        const apiJsons = this.genApiJsons(this.m.apisDirPath);
        this.m.inputschema = apiJsons;
        const { defaultSchemas, schemas } = genAjvSchemas({ apiJsons, definitions: ['Components'] });
        this.m.inputAjv = new Ajv({
          schemas: schemas.concat(defaultSchemas),
        });
      }
      return this.m.inputAjv;
    }

    if (type === 'output') {
      if (!this.m.outputAjv) {
        const apiJsons = this.genApiJsons(this.m.apisDirPath);
        const { defaultSchemas, schemas } = genOutPutAjvSchemas({ apiJsons, definitions: ['Components'] });
        this.m.outputAjv = new Ajv({
          schemas: schemas.concat(defaultSchemas),
        });
      }
      return this.m.outputAjv;
    }
    throw Error('type not match');
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
    return _genSwaggerRouter(this.m.apiJsonPath, this.m.htmlTitle);
  }
}

module.exports = SwaggerAndSchema;
module.exports.default = SwaggerAndSchema;
