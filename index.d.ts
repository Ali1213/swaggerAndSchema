
interface Config {
    swagger?: string;
    version?: string;
    title?: string;
    description?: string;
    schemes?: any;
    hostname?: string;
    port?: string;
    host?: string;
    basePath?: string;
    apiJsonPath?: string;
    apisDirPath?: string;
}

interface cacheArgs extends Config {
    apiJsons?: any;
    swaggerJson?: any;
    scheme?: any;
}


type router = (req:any,res:any) => void


// type validErr = schemaErr | string | void;

declare class SwaggerAndSchema {
    constructor(config: Config);
    m: cacheArgs;
    genApiJsonRouter(port?: string): router
    genSwaggerRouter(apiJsonPath?: string): router
    validate(params:any, actionName?: string, apisDirPath?: string): any
    check(params:any, actionName?: string, apisDirPath?: string): string
}



export default SwaggerAndSchema;