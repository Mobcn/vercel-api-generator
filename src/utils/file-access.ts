import { codeText2TableInfo, tableInfo2codeText } from './convert';
import { listFileHandle, readFileHandleAsText, write } from './file-system';
import { getDAOFileText, getModelFileText, getServiceFileText } from './template';
import type { TableInfo } from '../App.vue';

/**
 * 提取表信息
 *
 * @param text 模型文件内容
 */
function extructTableInfo(text: string) {
    const startStr = 'const info = ';
    const endStr = 'export';
    const structStr = text.substring(text.indexOf(startStr) + startStr.length, text.indexOf(endStr));
    return codeText2TableInfo(structStr);
}

/**
 * 获取模型列表
 *
 * @param handle 目录句柄
 */
async function listModel(handle: FileSystemDirectoryHandle): Promise<TableInfo[]> {
    const dirHandle = await handle.getDirectoryHandle('dao', { create: true });
    const handles: (FileSystemDirectoryHandle | FileSystemFileHandle)[] = [];
    const tables: TableInfo[] = [];
    // @ts-ignore
    for await (const handle of dirHandle.values()) {
        handles.push(handle);
    }
    return new Promise((resolve) => {
        (async () => {
            for (const handle of handles) {
                if (handle.kind === 'directory' && handle.name !== 'database') {
                    const moduleDirHandle = await handle.getDirectoryHandle('model', { create: true });
                    const fileHandles = await listFileHandle(moduleDirHandle);
                    for (const fileHandle of fileHandles) {
                        const content = await readFileHandleAsText(fileHandle);
                        tables.push({ module: handle.name, ...extructTableInfo(content) });
                    }
                }
            }
        })().then(() => {
            resolve(tables);
        });
    });
}

/**
 * 保存模型文件
 *
 * @param handle 目录句柄
 * @param tableInfo 表信息
 */
async function saveModel(handle: FileSystemDirectoryHandle, tableInfo: TableInfo) {
    const dirHandle = await handle.getDirectoryHandle('dao', { create: true });
    const moduleHandle = await dirHandle.getDirectoryHandle(tableInfo.module!, { create: true });
    const modelHandle = await moduleHandle.getDirectoryHandle('model', { create: true });
    const fileHandle = await modelHandle.getFileHandle(tableInfo.model + 'Model.js', { create: true });
    const fileText = getModelFileText(tableInfo2codeText(tableInfo, ['model', 'table', 'property']), tableInfo.model);
    return await write(fileHandle, fileText, false);
}

/**
 * 删除模型及相关文件
 *
 * @param handle 目录句柄
 * @param tableInfo 表信息
 */
async function removeModel(handle: FileSystemDirectoryHandle, tableInfo: TableInfo) {
    if (tableInfo.module === undefined) {
        throw new Error('模块名不存在!');
    }

    const [daoHandle, serviceHandle] = await Promise.all([
        handle.getDirectoryHandle('dao'),
        handle.getDirectoryHandle('service')
    ]);

    const promiseList: Promise<void>[] = [];

    // 删除Service文件
    promiseList.push(
        (async () => {
            const serviceModuleHandle = await serviceHandle.getDirectoryHandle(tableInfo.module!);
            await serviceModuleHandle.removeEntry(tableInfo.model + 'Service.js');
        })()
    );

    const daoModuleHandle = await daoHandle.getDirectoryHandle(tableInfo.module!);

    // 删除Model文件
    promiseList.push(
        (async () => {
            const daoModelHandle = await daoModuleHandle.getDirectoryHandle('model', { create: true });
            await daoModelHandle.removeEntry(tableInfo.model + 'Model.js');
        })()
    );

    // 删除DAO文件
    promiseList.push(daoModuleHandle.removeEntry(tableInfo.model + 'DAO.js'));

    await Promise.all(promiseList);
}

/**
 * 生成DAO文件和服务文件
 *
 * @param handle 目录句柄
 * @param tableInfo 表信息
 * @param cover 是否覆盖
 */
async function generateDAOAndService(handle: FileSystemDirectoryHandle, tableInfo: TableInfo, cover?: boolean) {
    if (tableInfo.module === undefined) {
        throw new Error('模块名不存在!');
    }

    const promiseList: Promise<void>[] = [];

    // 生成DAO文件
    promiseList.push(
        (async () => {
            const daoHandle = await handle.getDirectoryHandle('dao', { create: true });
            const daoModuleHandle = await daoHandle.getDirectoryHandle(tableInfo.module!, { create: true });
            const daoFileName = tableInfo.model + 'DAO.js';
            const daoFileText = getDAOFileText(tableInfo.module!, tableInfo.model);
            let daoFileHandle: FileSystemFileHandle;
            try {
                daoFileHandle = await daoModuleHandle.getFileHandle(daoFileName);
                cover && (await write(daoFileHandle, daoFileText, false));
            } catch (error) {
                daoFileHandle = await daoModuleHandle.getFileHandle(daoFileName, { create: true });
                await write(daoFileHandle, daoFileText, false);
            }
        })()
    );

    // 生成Serice文件
    promiseList.push(
        (async () => {
            const serviceHandle = await handle.getDirectoryHandle('service', { create: true });
            const serviceModuleHandle = await serviceHandle.getDirectoryHandle(tableInfo.module!, { create: true });
            const serviceFileName = tableInfo.model + 'Service.js';
            const serviceFileText = getServiceFileText(tableInfo.module!, tableInfo.model);
            let serviceFileHandle: FileSystemFileHandle;
            try {
                serviceFileHandle = await serviceModuleHandle.getFileHandle(serviceFileName);
                cover && (await write(serviceFileHandle, serviceFileText, false));
            } catch (error) {
                serviceFileHandle = await serviceModuleHandle.getFileHandle(serviceFileName, { create: true });
                await write(serviceFileHandle, serviceFileText, false);
            }
        })()
    );

    await Promise.all(promiseList);
}

export { listModel, saveModel, removeModel, generateDAOAndService };
