/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const encodeDefault = definition => JSON.parse(JSON.stringify(definition), (key, value) => {
  if (key === '$ref') {
    return definition[value.substring(0, value.lastIndexOf('/'))];
  }
  return value;
});
// /**
//  * @isFile 判断路径是否是文件
//  *
//  * @params { string } filepath
//  *
//  * @returns { boolean } 是否是文件
//  */
// const isFile = (filepath) => {
//   const stats = fs.statSync(filepath);
//   return stats.isFile();
// };

// /**
//  * @isDirectory 判断路径是否是文件夹
//  *
//  * @params { string } filepath
//  *
//  * @returns { boolean } 是否是文件夹
//  */
// const isDirectory = (filepath) => {
//   const stats = fs.statSync(filepath);
//   return stats.isDirectory();
// };

/**
  * 递归读取文件夹目录
  * @params { string } dirpath 读取的文件夹目录
  * @returns { Array.<string> } 返回文件夹内所有文件的绝对路径
  * TODO: node v10.10版本提供了readdir里面有参数withFileTypes，但考虑到现在的node版本基本上会比较低，所以先用stat实现
 */
const readFilesRecur = (dirpath) => {
  const files = [];
  const dirs = [dirpath];

  while (dirs.length > 0) {
    const dir = dirs.shift();
    const f = fs.readdirSync(dir);
    f.forEach((file) => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);
      if (stats.isDirectory()) {
        dirs.push(filepath);
      } else if (stats.isFile()) {
        files.push(filepath);
      }
    });
  }
  return files;
};

/**
 * 获取文件名，如路径`/home/user/dir/file.txt`的文件名为`file`
 * @params { string } 文件路径
 * @returns { string } 文件名
 */
const getfilename = filepath => path.basename(filepath, path.extname(filepath));
/*
 * @private
 * 往 docs 推送 { name, content }, name 是通过判断生成
 * 生成规则
 * @params { object } content对象
 * @params { string } api的目录文件夹
 * @params { string } 文件的实际文件夹
 * @params { Array.<object> } docs
 * @params { boolean? } needPrex 是否需要给name加上前缀
 * @params { string? } seq 前缀分割符
 * @returns { undefined }
 */
const addDocs = (content, dirpath, filepath, docs, needPrex = false, seq = path.sep) => {
  const name = content.name || getfilename(filepath);
  if (!needPrex) {
    docs.push({
      name,
      content,
    });
    return;
  }
  // const basename = path.basename(filepath);
  const fileRealDir = path.dirname(filepath);
  const prefix = path.relative(dirpath, fileRealDir).replace(path.seq, seq);
  docs.push({
    name: prefix ? `${prefix}${seq}${name}` : name,
    content,
  });
};


/**
 * 读取文件内容
 * 只返回json, yaml文件
 * @params { string } dirpath 读取的文件夹目录
 *
 * @returns { Array.<object> } content
 * @returns { Object } content.content 文件转化为json后的内容
 * @returns { string } content.name 文件名
 */
const importFilesFromPath = ({
  dirpath,
  needPrex,
  seq,
} = {}) => {
  const c = readFilesRecur(dirpath);
  const docs = [];
  c.forEach((file) => {
    const fileType = path.extname(file);
    if (fileType === '.json') {
      const content = JSON.parse(fs.readFileSync(file, 'utf8'));
      addDocs(content, dirpath, file, docs, needPrex, seq);
    } else if (fileType === '.yaml') {
      const content = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
      addDocs(content, dirpath, file, docs, needPrex, seq);
    }
  });
  return docs;
};

exports.importFilesFromPath = importFilesFromPath;

/**
 * @deprecated
 * genInputSchemas 生成api入参的schema
 */
const genInputSchemas = ({ apiJsons, definitions = [] } = {}) => apiJsons.reduce((prev, apiJson) => {
  if (definitions.includes(apiJson.name)) {
    prev.defaultSchemas[apiJson.name] = encodeDefault(apiJson);
    return prev;
  }
  // eslint-disable-next-line no-param-reassign
  prev.schemas[apiJson.name] = apiJson.content.body || {
    required: [],
    properties: {},
  };
  return prev;
}, { defaultSchemas: {}, schemas: {} });

exports.genInputSchemas = genInputSchemas;


/**
 * genAjvSchema 生成api入参的schema
 */
const genAjvSchemas = ({ apiJsons, definitions = [] } = {}) => apiJsons.reduce((prev, apiJson) => {
  if (definitions.includes(apiJson.name)) {
    prev.defaultSchemas.push({
      $id: apiJson.name,
      definitions: encodeDefault(apiJson),
    });
    return prev;
  }


  // eslint-disable-next-line no-param-reassign
  prev.schemas.push({
    $id: apiJson.name,
    type: 'object',
    ...(apiJson.content.body || {
      required: [],
      properties: {},
    }),
  });
  return prev;
}, { defaultSchemas: [], schemas: [] });

exports.genAjvSchemas = genAjvSchemas;


// const replaceRef = (schema, def) => JSON.parse(JSON.stringify(schema), (key, value) => {
//   if (key === '$ref') {
//     return def[value.substring(value.lastIndexOf('/') + 1)];
//   }
//   return value;
// });


const encodeDefaultSchema = (apiJsons) => {
  const d = apiJsons.find(item => item.name === 'Components');
  return encodeDefault(d);
};

/**
 * @deprecated
 */
const genOutPutSchemas = ({ apiJsons } = {}) => {
  let defaultSchemas = encodeDefaultSchema(apiJsons);
  const schema = {

  };


  apiJsons.forEach((apiJson) => {
    if (apiJson.name === 'Components') {
      defaultSchemas = apiJson.content;
      return;
    }
    if (apiJson.content.responses) {
      schema[apiJson.name] = apiJson.content.responses['200'].schema || {
        required: [],
        properties: {},
      };
    }
  });
  return {
    defaultSchemas,
    schema,
  };
};

exports.genOutPutSchemas = genOutPutSchemas;


const genOutPutAjvSchemas = ({ apiJsons, definitions = [] } = {}) => apiJsons.reduce((prev, apiJson) => {
  if (definitions.includes(apiJson.name)) {
    prev.defaultSchemas.push({
      $id: apiJson.name,
      definitions: encodeDefault(apiJson),
    });
    return prev;
  }

  if (apiJson.content.responses) {
    prev.schemas.push({
      $id: apiJson.name,
      type: 'object',
      ...apiJson.content.responses['200'].schema || {
        required: [],
        properties: {},
      },
    });
  }
  return prev;
}, { defaultSchemas: [], schemas: [] });

exports.genOutPutAjvSchemas = genOutPutAjvSchemas;
