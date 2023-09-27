<script lang="ts" setup>
import { computed, provide, ref, watchEffect } from 'vue';
import SideList from './components/SideList.vue';
import MainTable from './components/MainTable.vue';
import Loading from './components/modal/Loading.vue';

/** 临时表信息 */
const tmpTableInfo: TableInfo = { module: '<tmp>', model: '<Tmp>', table: '<tmp>', property: {} };
/** 当前表信息*/
const currentTableInfo = ref<TableInfo>(tmpTableInfo);

/** 侧边列表元素对象 */
const sideListRef = ref<{
    isConnect: () => boolean;
    saveTable: (tableInfo: TableInfo) => Promise<void>;
    generate: (tableInfo: TableInfo, cover?: boolean) => Promise<void>;
}>();
/** 主表元素对象 */
const mainTableRef = ref<{ checkSave: () => Promise<boolean> }>();

// 加载
const loadding = ref(false);
const loaddingProps = ref<{
    title?: string;
    width?: string | number;
    height?: string | number;
}>({});

/** 是否可以生成文件 */
const canGenerate = computed(() => {
    return (
        currentTableInfo.value.module !== tmpTableInfo.module &&
        Object.keys(currentTableInfo.value.property).length > 0 &&
        sideListRef.value?.isConnect() === true
    );
});

// 监听表
watchEffect(() => {
    if (currentTableInfo.value.module === tmpTableInfo.module) {
        tmpTableInfo.property = currentTableInfo.value.property;
    }
});

/**
 * 全局Loading设置
 *
 * @param value loading是否显示
 * @param props loading参数
 */
function setLoading(value: boolean, props?: typeof loaddingProps.value) {
    (loadding.value = value) && (loaddingProps.value = props ?? {});
}

/**
 * 编辑表字段属性
 *
 * @param tableInfo 表信息
 * @param backFun 失败回调函数
 */
async function editProperty(tableInfo?: TableInfo, backFun?: Function) {
    const $mainTable = mainTableRef.value;
    if ($mainTable) {
        if (await $mainTable.checkSave()) {
            currentTableInfo.value = tableInfo ?? tmpTableInfo;
        } else {
            backFun && backFun();
        }
    }
}

/**
 * 保存表
 *
 * @param tableInfo 表信息
 */
async function saveTable(tableInfo: TableInfo) {
    if (tableInfo.module !== tmpTableInfo.module) {
        sideListRef.value?.saveTable(tableInfo);
    }
}

/**
 * 生成文件
 *
 * @param tableInfo 表信息
 * @param cover 是否覆盖
 */
function generate(tableInfo: TableInfo, cover?: boolean) {
    if (tableInfo.module !== tmpTableInfo.module) {
        sideListRef.value?.generate(tableInfo, cover);
    }
}

// 全局Loading设置
provide('setLoading', setLoading);
</script>
<script lang="ts">
/** 表字段类型 */
export type FieldType = StringConstructor | NumberConstructor | DateConstructor | BooleanConstructor;
/** 表字段类型字符串 */
export type FieldTypeStr = 'String' | 'Number' | 'Date' | 'Boolean';

/**
 * 表字段属性
 */
export type TableProperty = {
    /** 表字段类型 */
    type: FieldTypeStr;
    /** 默认值 */
    default?: any;
    /** 是否非空 */
    required?: boolean;
    /** 是否全部转为小写（type为String时生效） */
    lowercase?: boolean;
    /** 是否全部转为大写（type为String时生效） */
    uppercase?: boolean;
    /** 是否去掉前后空格（type为String时生效） */
    trim?: boolean;
    /** 最短长度（type为String时生效） */
    minlength?: number;
    /** 最长长度（type为String时生效） */
    maxlength?: number;
    /** 最小值（type为Number或Date时生效） */
    min?: string | number;
    /** 最大值（type为Number或Date时生效） */
    max?: string | number;
};

/**
 * 表信息
 */
export type TableInfo = {
    /** 所属模块 */
    module?: string;
    /** 模型名 */
    model: string;
    /** 表名 */
    table: string;
    /** 表字段属性 */
    property: {
        [x: string]: TableProperty;
    };
};
</script>

<template>
    <div class="h-full flex gap-1 p2 box-border">
        <div class="w-16% min-w-250px"><SideList ref="sideListRef" @edit-table-info="editProperty" /></div>
        <div class="flex-1">
            <MainTable
                ref="mainTableRef"
                v-model="currentTableInfo"
                :can-generate="canGenerate"
                @save-table="saveTable"
                @generate="generate"
            />
        </div>
        <Loading
            v-model="loadding"
            :title="loaddingProps.title"
            :width="loaddingProps.width"
            :height="loaddingProps.height"
        />
    </div>
</template>

<style scoped></style>
