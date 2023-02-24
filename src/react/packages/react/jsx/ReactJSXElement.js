import hasOwnProperty from '../../shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from '../../shared/ReactSymbols';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

function warnIfStringRefCannotBeAutoConverted(config, self) {
  if (__DEV__) {
    if (
      typeof config.ref === 'string' &&
      ReactCurrentOwner.current &&
      self &&
      ReactCurrentOwner.current.stateNode !== self
    ) {
      const componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

      if (!didWarnAboutStringRefs[componentName]) {
        console.error(
          'Component "%s" contains the string ref "%s". ' +
            'Support for string refs will be removed in a future major release. ' +
            'This case cannot be automatically converted to an arrow function. ' +
            'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
            'Learn more about using refs safely here: ' +
            'https://reactjs.org/link/strict-mode-string-ref',
          getComponentNameFromType(ReactCurrentOwner.current.type),
          config.ref
        );
        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

function defineKeyPropWarningGetter(props, displayName) {
  if (__DEV__) {
    const warnAboutAccessingKey = function () {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        console.error(
          '%s: `key` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://reactjs.org/link/special-props)',
          displayName
        );
      }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, 'key', {
      get: warnAboutAccessingKey,
      configurable: true,
    });
  }
}
function defineRefPropWarningGetter(props, displayName) {
  if (__DEV__) {
    const warnAboutAccessingRef = function () {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;
        console.error(
          '%s: `ref` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://reactjs.org/link/special-props)',
          displayName
        );
      }
    };
    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, 'ref', {
      get: warnAboutAccessingRef,
      configurable: true,
    });
  }
}

/**
 *
 * @param {*} type 类型
 * @param {*} key key
 * @param {*} ref 引用
 * @param {*} self
 * @param {*} source
 * @param {*} props
 * @returns
 */
const ReactElement = function (type, key, ref, self, source, props) {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };

  if (__DEV__) {
    element._store = {};
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false,
    });
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self,
    });
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

function hasValidKey(config) {
  return config.key !== undefined;
}
function hasValidRef(config) {
  return config.ref !== undefined;
}

/**
 *
 * @param {*} type 类型
 * @param {*} config 配置
 * @param {*} maybeKey
 * @param {*} source
 * @param {*} self
 */
export function jsxDEV(type, config, maybeKey, source, self) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
    warnIfStringRefCannotBeAutoConverted(config, self);
  }
  // Remaining properties are added to a new props object
  for (propName in config) {
    if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (key || ref) {
    const displayName =
      typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;
    if (key) {
      defineKeyPropWarningGetter(props, displayName);
    }
    if (ref) {
      defineRefPropWarningGetter(props, displayName);
    }
  }
  // 3. 返回ReactElement对象
  return ReactElement(type, key, ref, self, source, props);
}
