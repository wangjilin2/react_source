import { ELEMENT_TEXT } from "./constant";
/**
 * 创建元素
 */
function createElement(type, config, ...children) {
  delete config._self;
  delete config._source;
  return {
    type,
    props: {
      ...config,//作兼容处理，如果是react元素就返回自己，如果是文本类型，如果是一个字符串的话，返回元素对象
      children: children.map((child) => {
        return typeof child === "object"
          ? child
          : {
              type: ELEMENT_TEXT,
              props: { text: child, children: [] },
            };
      }),
    },
  };
}
const React={
    createElement,
}
export default React;
