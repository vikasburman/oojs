const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const which = (def) => {
    // full blown def can be:
    // envProp::mainThreadOnServer{.min}.xyz ~ envProp::workerThreadOnServer{.min}.xyz | envProp::mainThreadOnClient{.min}.xyz ~ envProp::workerThreadOnClient{.min}.xyz

    let item = def,
        items = null,
        envProp = null;

    if (item.indexOf('|') !== -1) { // server | client
        items = item.split('|');
        if (options.env.isServer) { // left is server
            item = items[0].trim();
        } else { // right is client
            item = items[1].trim();
        }
        if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
    }

    // worker environment specific pick
    if (item.indexOf('~') !== -1) { // main thread ~ worker thread
        items = item.split('~');
        if (!options.env.isWorker) { // left is main thread
            item = items[0].trim();
        } else { // right is worker thread
            item = items[1].trim(); 
        }
        if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
    }

    // environment specific condition
    if (item.indexOf('::') !== -1) { // isVue::./flair.ui.vue{.min}.js
        items = item.split('::'),
        envProp = items[0].trim();
        item = items[1].trim();
        if (!(options.env[envProp] || options.env.x()[envProp])) { // if envProp is NOT defined neither at root env nor at extended env, OR defined but is false / falsy
            item = '';  // special case to dynamically mark absence of a type
        }
    }

    // debug/prod specific pick
    if (item.indexOf('{.min}') !== -1) {  
        if (options.env.isDebug) {
            item = item.replace('{.min}', ''); // a{.min}.js => a.js
        } else {
            item = item.replace('{.min}', '.min'); // a{.min}.js => a.min.js
        }
    }

    return item; // modified or as is or empty
};
const isArrow = (fn) => {
    return (!(fn).hasOwnProperty('prototype') && fn.constructor.name === 'Function');
};
const isASync = (fn) => {
    return (fn.constructor.name === 'AsyncFunction');
};
const findIndexByProp = (arr, propName, propValue) => {
    return arr.findIndex((item) => {
        return (item[propName] === propValue ? true : false);
    });
};
const findItemByProp = (arr, propName, propValue) => {
    let idx = arr.findIndex((item) => {
        return (item[propName] === propValue ? true : false);
    });
    if (idx !== -1) { return arr[idx]; }
    return null;
};
const splitAndTrim = (str, splitChar) => {
    if (!splitChar) { splitChar = ','; }
    return str.split(splitChar).map((item) => { return item.trim(); });
};
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");  // eslint-disable-line no-useless-escape
};
const replaceAll = (string, find, replace) => {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};
const stuff = (str, args) => {
    if (typeof str === 'string' && Array.isArray(args) && args.length > 0) {
        let idx = 0;
        for(let arg of args) {
            str = replaceAll(str, `%${++idx}`, arg);
        }
    }
    return str;
};
const shallowCopy = (target, source, overwrite, except) => {
    if (!except) { except = []; }
    for(let item in source) {
        if (source.hasOwnProperty(item) && except.indexOf(item) === -1) { 
            if (!overwrite) { if (item in target) { continue; }}
            target[item] = source[item];
        }
    }
    return target;
};
const loadFile = async (file) => { // text based file loading operation - not a general purpose fetch of any url (it assumes it is a phycical file)
    let loader = null;
    if (isServer) {
        loader = _Port('serverFile');
    } else { // client
        loader = _Port('clientFile');
    }
    return await loader(file);
};
const loadModule = async (module, globalObjName, isDelete) => {
    if (isServer) {
        return await _Port('serverModule').require(module);
    } else { // client
        let obj = await _Port('clientModule').require(module);
        if (!obj && typeof globalObjName === 'string') {
            if (isWorker) {
                obj = WorkerGlobalScope[globalObjName] || null;
                if (isDelete) { delete WorkerGlobalScope[globalObjName]; }
            } else {
                obj = window[globalObjName] || null;
                if (isDelete) { delete window[globalObjName]; }
            }
        }
        if (obj) { return obj; }
    }
};
const lens = (obj, path) => path.split(".").reduce((o, key) => o && o[key] ? o[key] : null, obj);
const globalSetting = (path, defaultValue, globalRoot = 'global') => {
    // any global setting (i.e., outside of a specific assembly setting) can be defined at:
    // "global" root node (or anything else that is given) in appConfig/webConfig file
    // Each setting can be at any depth inside "global" (or anything else given) and its generally a good idea to namespace intelligently to
    // avoid picking someone else' setting
    let _globalSettings = _AppDomain.config() ? (_AppDomain.config()[globalRoot] || {}) : {};
    return lens(_globalSettings, path) || defaultValue;
};
const sieve = (obj, props, isFreeze, add) => {
    let _props = props ? splitAndTrim(props) : Object.keys(obj); // if props are not give, pick all
    const extract = (_obj) => {
        let result = {};
        if (_props.length > 0) { // copy defined
            for(let prop of _props) { result[prop] = _obj[prop]; } 
        } else { // copy all
            for(let prop in obj) { 
                if (obj.hasOwnProperty(prop)) { result[prop] = obj[prop]; }
            }            
        }
        if (add) { for(let prop in add) { result[prop] = add[prop]; } }
        if (isFreeze) { result = Object.freeze(result); }
        return result;
    };
    if (Array.isArray(obj)) {
        let result = [];
        for(let item of obj) { result.push(extract(item)); }
        return result;
    } else {
        return extract(obj);
    }
};
const b64EncodeUnicode = (str) => { // eslint-disable-line no-unused-vars
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
};
const b64DecodeUnicode = (str) => {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}; 
const uncacheModule = (module) => {
    if (isServer) {
        _Port('serverModule').undef(module);
    } else { 
        _Port('clientModule').undef(module);
    }
};
const deepMerge = (objects, isMergeArray = true) => { // credit: https://stackoverflow.com/a/48218209
    const isObject = obj => obj && typeof obj === 'object';
    
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];
        
            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                if (isMergeArray) {
                    prev[key] = pVal.concat(...oVal); // merge array
                } else {
                    prev[key] = [].concat(...oVal); // overwrite as new array
                }
            } else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = deepMerge([pVal, oVal], isMergeArray);
            } else {
                prev[key] = oVal;
            }
        });
        return prev;
    }, {});
};
const getLoadedScript = (...scriptNames) => {
    if (isServer || isWorker) { return ''; }
    let scriptFile = '',
        baseUri = '',
        el = null;
    for(let scriptName of scriptNames) {
        for(let script of window.document.scripts) {
            if (script.src.endsWith(scriptName)) {
                el = window.document.createElement('a');
                el.href = script.src;
                baseUri = el.protocol + '//' + el.host + '/';
                el = null;
                scriptFile = './' + script.src.replace(baseUri, '');
                break;
            }
        }
        if (scriptFile) { break; }
    }
    return scriptFile;
};