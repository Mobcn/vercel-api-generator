<script lang="ts" setup>
import { computed, inject, reactive, ref } from 'vue';
import { VXETable } from 'vxe-table';
import { openDirectoryPicker } from '../utils/file-system';
import { listModel, saveModel, removeModel, generateDAOAndService } from '../utils/file-access';
import AddTableModal from './modal/AddTable.vue';
import type { VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from 'vxe-table';
import type { TableInfo } from '../App.vue';

/** 回调 */
const emits = defineEmits<{
    /** 编辑表 */
    editTableInfo: [tableInfo?: TableInfo, cb?: Function];
}>();

/** 全局Loading设置 */
const setLoading = inject('setLoading') as (
    value: boolean,
    props?: {
        title?: string;
        width?: string | number;
        height?: string | number;
    }
) => void;

/** 连接根句柄 */
const rootHandle = ref<FileSystemDirectoryHandle | null>(null);

/** 所有表信息 */
const tableAll = ref<TableInfo[]>([]);
/** 当前筛选模块 */
const currentModule = ref<string>();

/** 表同步列表 */
const syncList = reactive<TableInfo[]>([]);

/** 表模块列表 */
const moduleList = computed<string[]>(() => {
    const set = new Set<string>(tableAll.value.map((item) => item.module!));
    return Array.from(set);
});
/** 表列表 */
const tableList = computed<TableInfo[]>(() => {
    if (currentModule.value) {
        return tableAll.value.filter((model) => model.module === currentModule.value);
    }
    return tableAll.value;
});

/** 新建表弹窗元素对象 */
const tableRef = ref<VxeTableInstance<TableInfo>>();
/** 新建表弹窗元素对象 */
const addModal = ref();

/** 右键菜单项设置 */
const menuConfig = reactive<VxeTablePropTypes.MenuConfig<TableInfo>>({
    body: {
        options: [
            [
                { code: 'connect', name: '连接' },
                { code: 'disconnect', name: '断开连接' }
            ],
            [
                { code: 'add', name: '新建表' },
                { code: 'remove', name: '删除当前表' }
            ],
            [
                { code: 'generate', name: '文件生成' },
                { code: 'generate-cover', name: '文件生成（覆盖）' }
            ]
        ]
    },
    visibleMethod: ({ options, row }) => {
        options[0][0].visible = rootHandle.value == null;
        options[0][1].visible = rootHandle.value != null;
        options[1][0].visible = rootHandle.value != null;
        if (row) {
            options[1][1].visible = true;
            if (Object.keys(row.property).length > 0) {
                options[2][0].visible = true;
                options[2][1].visible = true;
            }
        } else {
            options[1][1].visible = false;
            options[2][0].visible = false;
            options[2][1].visible = false;
        }
        return true;
    }
});

/** 右键菜单项事件 */
const contextMenuClickEvent: VxeTableEvents.MenuClick<TableInfo> = ({ $table, menu, row }) => {
    switch (menu.code) {
        case 'connect':
        case 'disconnect':
            connectOrDisconnect();
            break;
        case 'add':
            addModal.value.open();
            break;
        case 'remove':
            const index = tableAll.value.findIndex((item) => item.module === row.module && item.table === row.table);
            row === $table.getCurrentRecord() && emits('editTableInfo');
            setLoading(true, { title: '删除中...' });
            removeModel(rootHandle.value!, row).then(() => {
                tableAll.value.splice(index, 1);
                setLoading(false);
            });
            break;
        case 'generate':
            generate(row);
            break;
        case 'generate-cover':
            generate(row, true);
            break;
    }
};

/** 行选中事件 */
const currentChangeEvent: VxeTableEvents.CurrentChange<TableInfo> = ({ newValue, oldValue, $table }) => {
    const target = tableAll.value.find((item) => item.module === newValue.module && item.table === newValue.table);
    emits('editTableInfo', target, () => $table.setCurrentRow(oldValue));
};

/**
 * 连接或断开本地文件
 */
async function connectOrDisconnect() {
    currentModule.value = undefined;
    if (rootHandle.value) {
        tableAll.value = [];
        rootHandle.value = null;
        emits('editTableInfo');
        return;
    } else {
        rootHandle.value = await openDirectoryPicker();
        if (rootHandle.value === null) {
            VXETable.modal.message({ content: '请选择文件夹并授予必要的权限!', status: 'error' });
        } else {
            listModel(rootHandle.value)
                .then((tables) => {
                    tableAll.value = tables;
                })
                .catch(() => {
                    VXETable.modal.message({ content: '请授予必要的权限!', status: 'error' });
                });
        }
    }
}

/**
 * 新建表
 *
 * @param props 表参数
 */
function addTable(props: { module: string; model: string; table: string }) {
    tableAll.value.push({ property: {}, ...props });
}

/**
 * 保存表
 *
 * @param tableInfo 表信息
 */
async function saveTable(tableInfo: TableInfo) {
    const { tableData } = tableRef.value!.getTableData();
    const row = tableData.find((row) => row.module === tableInfo.module && row.table === tableInfo.table);
    row && !syncList.includes(row) && syncList.push(row);
    await saveModel(rootHandle.value!, tableInfo, () => {
        const index = syncList.findIndex((item) => item === row);
        index !== -1 && syncList.splice(index, 1);
    }).catch(() => {
        VXETable.modal.message({ content: '保存失败!', status: 'error' });
    });
}

/**
 * 生成文件
 *
 * @param tableInfo 表信息
 * @param cover 是否覆盖
 */
async function generate(tableInfo: TableInfo, cover?: boolean) {
    setLoading(true, { title: '生成文件中...' });
    await generateDAOAndService(rootHandle.value!, tableInfo, cover);
    setLoading(false);
}

/**
 * 是否连接
 */
function isConnect() {
    return rootHandle != null;
}

// 导出
defineExpose({ isConnect, saveTable, generate });
</script>

<template>
    <div class="h-full flex flex-col">
        <div>
            <VxeToolbar size="mini">
                <template #buttons>
                    <VxeButton
                        :status="rootHandle ? 'success' : 'default'"
                        :icon="rootHandle ? 'vxe-icon-lock' : 'vxe-icon-unlock'"
                        :content="rootHandle ? '已连接' : '未连接'"
                        @click="connectOrDisconnect"
                    ></VxeButton>
                    <span v-if="moduleList.length > 0" class="ml-2">模块:</span>
                    <VxeSelect
                        v-if="moduleList.length > 0"
                        class-name="w-25 ml-1"
                        v-model="currentModule"
                        placeholder="所有"
                        clearable
                    >
                        <VxeOption v-for="mod in moduleList" :key="mod" :value="mod" :label="mod"></VxeOption>
                    </VxeSelect>
                </template>
            </VxeToolbar>
        </div>
        <div class="flex-1 h-0">
            <VxeTable
                ref="tableRef"
                height="auto"
                size="mini"
                :row-config="{ isCurrent: true, isHover: true }"
                :show-header="false"
                :data="tableList"
                :menu-config="menuConfig"
                @current-change="currentChangeEvent"
                @menu-click="contextMenuClickEvent"
            >
                <VxeColumn class-name="hover:cursor-pointer">
                    <template #default="{ row }: { row: TableInfo }">
                        <span>{{ `[${row.module}] ${row.table} : ${row.model}` }}</span>
                        <span v-if="syncList.includes(row)" class="color-red">（同步中）</span>
                    </template>
                </VxeColumn>
            </VxeTable>
        </div>
        <AddTableModal ref="addModal" :modules="moduleList" @confirm="addTable" />
    </div>
</template>

<style scoped></style>
