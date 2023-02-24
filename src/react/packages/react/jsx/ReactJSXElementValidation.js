import { jsxDEV } from './ReactJSXElement';

/**
 *
 * @param {*} type 类型
 * @param {*} props 参数
 * @param {*} key key值
 * @param {*} isStaticChildren
 * @param {*} source
 * @param {*} self
 */
// 1. 传入jsx的身份信息去jsxWithValidation验证/
export const jsxWithValidation = (type, props, key, isStaticChildren, source, self) => {
  console.log('jsx entry :', type, props, key);
  // 2. 通过jsxDev来生成element元素
  const element = jsxDEV(type, props, key, source, self);

  return element;
};
