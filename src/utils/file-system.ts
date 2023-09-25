/**
 * 打开目录选择器
 *
 * @returns 目录句柄
 */
async function openDirectoryPicker() {
    try {
        // @ts-ignore
        return (await showDirectoryPicker()) as FileSystemDirectoryHandle;
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * 获取目录中的文件句柄数组
 *
 * @param dirHandle 目录句柄
 * @returns 文件句柄数组
 */
async function listFileHandle(dirHandle: FileSystemDirectoryHandle) {
    const handleList: Array<FileSystemFileHandle> = [];
    // @ts-ignore
    for await (const handle of dirHandle.values()) {
        if (handle.kind === 'file') {
            handleList.push(handle);
        }
    }
    return handleList;
}

/**
 * 读取文件句柄文件
 *
 * @param fileHandle 文件句柄
 */
async function readFileHandleAsText(fileHandle: FileSystemFileHandle) {
    return new Promise(async function (resolve, reject) {
        try {
            const file = await fileHandle.getFile();
            const reader = new FileReader();
            reader.onload = () => {
                // @ts-ignore
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsText(file);
        } catch (error) {
            reject(error);
        }
    }) as Promise<string>;
}

/**
 * 文件写入
 *
 * @param fileHandle 文件句柄
 * @paramdata 写入数据
 * @param isAppend 是否追加
 * @returns 写入是否成功
 */
async function write(fileHandle: FileSystemFileHandle, data: FileSystemWriteChunkType, isAppend = true) {
    const writable = await fileHandle.createWritable({ keepExistingData: isAppend });
    if (isAppend) {
        const file = await fileHandle.getFile();
        await writable.seek(file.size);
    }
    await writable.write(data);
    await writable.close();
    return true;
}

export { openDirectoryPicker, listFileHandle, readFileHandleAsText, write };
