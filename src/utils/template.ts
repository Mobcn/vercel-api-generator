/**
 * 获取模型文件文本
 *
 * @param model 模型名称
 * @param info 表信息
 */
function getModelFileText(info: string, model: string = '') {
    return `import mongoose, { Schema } from 'mongoose';

/**
 * ${model}表
 */
const info = ${info};

export const Model = mongoose.model(info.model, new Schema(info.property), info.table);
`;
}

/**
 * 获取数据访问文件文本
 *
 * @param module 模块名称
 * @param model 模型名称
 */
function getDAOFileText(module: string, model: string) {
    const firstLowerModel = model.replace(model[0], model[0].toLowerCase());
    return `import { BaseDAO } from '#dao/BaseDAO.js';
import { Model } from '#dao/${module}/model/${model}Model.js';

/**
 * ${model}数据访问
 *
 * @extends {BaseDAO<typeof Model>}
 */
class ${model}DAO extends BaseDAO {}

const ${firstLowerModel}DAO = new ${model}DAO(Model);
export { ${model}DAO, ${firstLowerModel}DAO };
`;
}

/**
 * 获取服务文件文本
 *
 * @param module 模块名称
 * @param model 模型名称
 */
function getServiceFileText(module: string, model: string) {
    const firstLowerModel = model.replace(model[0], model[0].toLowerCase());
    return `import { BaseService } from '#service/BaseService.js';
import { ${firstLowerModel}DAO } from '#dao/${module}/${model}DAO.js';

/** @typedef {import('#dao/${module}/${model}DAO').${model}DAO} DAO */
/** @typedef {import('#service/BaseService').ExtractModel<DAO>} Model */

/**
 * ${model}服务
 * 
 * @extends {BaseService<DAO, Model>}
 */
class ${model}Service extends BaseService {}

const ${firstLowerModel}Service = new ${model}Service(${firstLowerModel}DAO);
export { ${model}Service, ${firstLowerModel}Service };
`;
}

export { getModelFileText, getDAOFileText, getServiceFileText };
