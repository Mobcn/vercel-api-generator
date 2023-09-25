import type { FieldType, TableInfo, TableProperty } from '../App.vue';

/**
 * 代码文本转为表信息对象
 *
 * @param text 代码文本
 */
function codeText2TableInfo(text: string) {
    const tableInfo = eval('const info = ' + text + ';info;');
    Object.entries(tableInfo.property as { [x: string]: { type: FieldType; default: Function } | FieldType }).forEach(
        ([name, property]) => {
            if (typeof property === 'function') {
                if (property === String) {
                    tableInfo.property[name] = { type: 'String' };
                } else if (property === Number) {
                    tableInfo.property[name] = { type: 'Number' };
                } else if (property === Date) {
                    tableInfo.property[name] = { type: 'Date' };
                } else if (property === Boolean) {
                    tableInfo.property[name] = { type: 'Boolean' };
                }
            } else {
                const replace = {} as any;
                if (property.type === String) {
                    replace.type = 'String';
                } else if (property.type === Number) {
                    replace.type = 'Number';
                } else if (property.type === Date) {
                    replace.type = 'Date';
                    if (property.default === Date.now) {
                        replace.default = 'Date.now';
                    }
                } else if (property.type === Boolean) {
                    replace.type = 'Boolean';
                }
                tableInfo.property[name] = Object.assign(property, replace);
            }
        }
    );
    return tableInfo as TableInfo;
}

/**
 * 表信息对象转为代码文本
 */
const tableInfo2codeText = (() => {
    const quoteMark = '#<#__QUOTE__#>#';
    const stringMark = '#<#__String__#>#';
    /**
     * @param tableInfo 表信息
     * @param views 展示的字段
     */
    return function (tableInfo: TableInfo, views?: (keyof TableInfo)[]) {
        views ??= ['module', 'model', 'table', 'property'];
        let object = {} as any;
        views.includes('module') && (object.module = stringMark + tableInfo.module + stringMark);
        views.includes('model') && (object.model = stringMark + tableInfo.model + stringMark);
        views.includes('table') && (object.table = stringMark + tableInfo.table + stringMark);
        if (views.includes('property')) {
            const newProperty = {} as any;
            Object.entries(tableInfo.property).forEach(([name, props]) => {
                if (Object.keys(props).length === 1) {
                    newProperty[name] = props.type;
                    return;
                }
                const replace = {} as TableProperty;
                if (props.type === 'String' && props.default != null) {
                    replace.default = stringMark + props.default.replace(/"/g, quoteMark) + stringMark;
                } else if (props.type === 'Date') {
                    props.min && (replace.min = stringMark + props.min + stringMark);
                    props.max && (replace.max = stringMark + props.max + stringMark);
                }
                newProperty[name] = Object.assign({}, props, replace);
            });
            views.includes('property') && (object.property = newProperty);
        }
        if (views.length === 1 && views[0] === 'property') {
            object = object.property;
        }
        let text = JSON.stringify(object, null, 4);
        text = text.replace(/"/g, '');
        text = text.replace(new RegExp(quoteMark, 'g'), '\\"');
        text = text.replace(new RegExp(stringMark, 'g'), '"');
        return text;
    };
})();

export { codeText2TableInfo, tableInfo2codeText };
