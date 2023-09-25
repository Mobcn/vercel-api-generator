<script setup lang="ts">
withDefaults(
    defineProps<{
        title: string;
        width: string | number;
        height: string | number;
    }>(),
    {
        title: '加载中...',
        width: '110',
        height: '70'
    }
);

const loadding = defineModel<boolean>({ required: true });
</script>

<template>
    <VxeModal v-model="loadding" :show-header="false" :show-footer="false" :width="width" :height="height">
        <div class="w-full h-full flex flex-col justify-between items-center color-#409eff">
            <span><i class="vxe-icon-spinner roll text-1.4em"></i></span>
            <span class="text-14px">{{ title }}</span>
        </div>
    </VxeModal>
</template>

<style scoped></style>
