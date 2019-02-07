let isSkipClear = false;
const attributesAndModifiers = (def, memberName, memberType) => {
    let appliedAttrs = _attr.collect(isSkipClear), // [{name, cfg, attr, args}]
        attrBucket = null,
        modifierBucket = null,
        isTypeLevel = (typeof memberName === 'boolean');
    if (isTypeLevel) {
        attrBucket = def.attrs.type;
        modifierBucket = def.modifiers.type;
    } else {
        attrBucket = def.attrs.members[memberName] = []; // create bucket
        modifierBucket = def.modifiers.members[memberName] = []; // create bucket
    }

    // validator
    const validator = (appliedAttr) => {
        let result = false;
        // target check
        if (isTypeLevel) {
            if (appliedAttr.cfg.targets.types.length === 0 && appliedAttr.cfg.targets.typeNames.length === 0) { result = true; } // no targets defined
            if (!result && appliedAttr.cfg.targets.types.indexOf(def.types.type) !== -1) { result = true; }
            if (!result && appliedAttr.cfg.targets.typeNames.indexOf(def.name) !== -1) { result = true; }
        } else {
            if (appliedAttr.cfg.targets.members.length === 0 ) { result = true; } // no targets defined
            if (!result && appliedAttr.cfg.targets.members.indexOf(memberType) !== -1) { result = true; }
        }

        // constraints check
        if (result) {
            // TODO:
        }

        // return
        return result;
    };

    // validate and collect
    for (let appliedAttr of appliedAttrs) {
        if (validator(appliedAttr)) {
            if (appliedAttr.attr) { // custom attribute
                attrBucket.push(appliedAttr);
            } else { // inbuilt attribute or modifier
                if(appliedAttr.cfg.isModifier) { 
                    modifierBucket.push(appliedAttr);
                } else {
                    attrBucket.push(appliedAttr);
                }
            }
        }
    }
};
const modifiersRefl = (def) => {
    const probe = (modifierName, memberName) => {
        let fn = () => {
            return modifiers.get(modifierName, memberName) || modifiers.get(modifierName, memberName, true); 
        };
        fn.current = () => {
            return modifiers.get(modifierName, memberName); 
        };
        fn.inherited = () => {
            return modifiers.get(modifierName, memberName, true); 
        };
        return fn;
    };
    let modifiers = {
        get: (modifierName, memberName, isCheckInheritance) => {
            let isTypeLevel = typeof (memberName === 'boolean'),
                result = null;
            if (isTypeLevel) {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.modifiers.type, 'name', modifierName);
                } else {
                    // TODO
                }
            } else {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.modifiers.members[memberName], 'name', modifierName);
                } else {
                    // TODO
                }
            }
            return result;
        },
        has: (modifierName, memberName, isCheckInheritance) => {
            return modifiers.get(modifierName, memberName, isCheckInheritance) !== null;
        },
        type: {
            get: (modifierName, isCheckInheritance) => {
                return modifiers.get(modifierName, true, isCheckInheritance);
            },
            has: (modifierName, isCheckInheritance) => {
                return modifiers.has(modifierName, true, isCheckInheritance);
            },
            isStatic: () => { return modifiers.type.get('static'); },
            isAbstract: () => { return modifiers.type.get('abstract'); },
            isSealed: () => { return modifiers.type.get('sealed'); }
        },
        member: {
            get: modifiers.get,
            has: modifiers.has,
            isStatic: probe('static', memberName),
            isAbstract: probe('abstract', memberName),
            isSealed: probe('sealed', memberName),
            isOverride: probe('override', memberName),
            isPrivate: probe('private', memberName),
            isProtected: probe('protected', memberName),
            isReadonly: probe('readonly', memberName),
            isAsync: probe('async', memberName)
        }
    };
    return _modifiers;
};
const attrsRefl = (def, obj) => {
    const probe = (attrName, memberName) => {
        let fn = () => {
            return attrs.get(attrName, memberName) || attrs.get(attrName, memberName, true); 
        };
        fn.current = () => {
            return attrs.get(attrName, memberName); 
        };
        fn.inherited = () => {
            return attrs.get(attrName, memberName, true); 
        };
        return fn;
    };    
    let attrs = {
        get: (attrName, memberName, isCheckInheritance) => {
            let isTypeLevel = typeof (memberName === 'boolean'),
                result = null;
            if (isTypeLevel) {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.attrs.type, 'name', attrName);
                } else {
                    // TODO
                }
            } else {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.attrs.members[memberName], 'name', attrName);
                } else {
                    // TODO
                }
            }
            return result;
        },
        has: (attrName, memberName, isCheckInheritance) => {
            return attrs.get(attrName, memberName, isCheckInheritance) !== null;
        },
        type: {
            get: (attrName, isCheckInheritance) => {
                return attrs.get(attrName, true, isCheckInheritance);
            },
            has: (attrName, isCheckInheritance) => {
                return attrs.has(attrName, true, isCheckInheritance);
            },
            isSingleton: () => { return attrs.type.has('singleton'); },
            isDeprecated: () => {return attrs.type.has('deprecate'); }
        },
        member: {
            get: attrs.get,
            has: attrs.has,
            isDeprecated: probe('deprecate', memberName),
            isMixed: probe('mixed', memberName),
            isSession: probe('session', memberName),
            isState: probe('state', memberName),
            isConditional: probe('conditional', memberName),
        }
    };
    return _attrs;
};
const buildTypeInstance = (cfg, Type, params, obj) => {
    if (cfg.singleton && params.isTopLevelInstance && Type._.singleInstance()) { return Type._.singleInstance(); }

    // define vars
    let _noop = noop,
        exposed_obj = {},
        mixin_being_applied = null,
        _constructName = '_construct',
        _disposeName = '_dispose',
        _props = {}, // plain property values storage inside this closure
        def = { 
            name: cfg.params.typeName,
            Type: Type,
            types: {
                type: cfg.types.type, // the type of the type itself: class, struct, etc.
                members: {} // each named item here defines the type of member: func, prop, event, construct, etc.
            },
            attrs: { 
                type: [], // will have: {name, cfg, attr, args}
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            },
            modifiers: {
                type: [], // will have: {name, cfg, attr, args}
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            }
        },
        proxy = null,
        isBuildingObj = false,
        _sessionStorage = _Port('sessionStorage'),
        _localStorage = _Port('localStorage');

    const buildProp = (memberName, memberDef) => {
        let _member = {
            get: null,
            set: null
        },
        _getter = _noop,
        _setter = _noop,
        _isReadOnly = attrs.has('readonly', memberName),
        _isOnce = attrs.has('once', memberName),
        propHost = null,
        uniqueName = typeName + '_' + memberName,
        isStorageHost = false;        

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] === 'function') { throw new _Exception('InvalidOperation', `Property is not found to override. (${memberName})`); }

            // property gets redefined completely, so no wrap call
        } else {
            // duplicate check, only when not overridden
            if (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true)) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }
        }
        
        // define or redefine
        if (memberDef.get || memberDef.set) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                if (cfg.static && attrs.has('static', memberName)) { throw new _Exception('InvalidOperation', `Static properties cannot be defined with a custom getter/setter. (${memberName})`); } 
                if (cfg.storage && (attrs.has('session', memberName) || attrs.has('state', memberName))) { throw new _Exception('InvalidOperation', `Session/State properties cannot be defined with a custom getter/setter. (${memberName})`); }
                _getter = memberDef.get;
            }
            if (memberDef.set && typeof memberDef.set === 'function') {
                _setter = memberDef.set;
            }
            _member.get = function() {
                if (isArrow(_getter)) { return _getter(); } else { return _getter.apply(obj); }
            }.bind(obj);
            _member.set = function(value) {
                if (_isReadOnly) {
                    // readonly props can be set only - either when object is being constructed 
                    // OR if 'once' is applied, and value is not already set
                    if (!((obj._.constructing || isOnce) && !_member.get())) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isArrow(_setter)) { return _setter(value); } else { return _setter.apply(obj, [value]); }
            }.bind(obj);
        } else { // direct value
            if (cfg.static && attrs.has('static', memberName)) {
                propHost = staticInterface;
            }
            if (!propHost && cfg.storage && attrs.has('session', memberName)) {
                if (!_sessionStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (sessionStorage)'); }
                propHost = _sessionStorage;
                isStorageHost = true;
            }
            if (!propHost && cfg.storage && attrs.has('state', memberName)) {
                if (!_localStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (localStorage)'); }
                propHost = _localStorage;
                isStorageHost = true;
            }
            if (!propHost) { // regular property
                uniqueName = memberName;
                propHost = def.props;
            }
            if(propHost) {
                if (isStorageHost) {
                    if (!propHost.key(uniqueName)) { 
                        propHost.setKey(uniqueName, JSON.stringify({value: memberDef})); 
                    }
                } else {
                    if (typeof propHost[uniqueName] === 'undefined') {
                        propHost[uniqueName] = memberDef; 
                    }
                }
            }
            _member.get = function() {
                if (isStorageHost) { 
                    return JSON.parse(propHost.getKey(uniqueName)).value; 
                }
                return propHost[uniqueName];                
            }.bind(obj);
            _member.set = function(value) {
                if (_isReadOnly) {
                    // readonly props can be set only - either when object is being constructed 
                    // OR if 'once' is applied, and value is not already set
                    if (!(obj._.constructing || isOnce) && !_member.get()) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isStorageHost) {
                    propHost.setKey(uniqueName, JSON.stringify({value: value}));
                } else {
                    propHost[uniqueName] = value;
                }
            }.bind(obj);

        }

        // return
        return _member;
    };
    const buildFunc = (memberName, memberDef) => {
        let _member = null;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] !== 'function') { throw new _Exception('InvalidOperation', `Function is not found to override. (${memberName})`); }

            // wrap for base call
            let base = obj[memberName].bind(obj);
            _member = function(...args) {
                let fnArgs = [base].concat(args); // run fn with base as first parameter
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(obj, fnArgs); }
            }.bind(obj);
        }

        // duplicate check, if not overridden
        if (!_member && (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true))) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }

        // static definition, if not defined
        if (!_member && cfg.static && attrs.has('static', memberName)) {
            if (isArrow(memberDef)) { throw new _Exception('InvalidOperation', `Static functions must not be defined as arrow function. (${memberName})`); }

            // shared (static) copy bound to staticInterface
            // so with 'this' it will be able to access only static properties
            _member = function(...args) {
                return memberDef.apply(staticInterface, args);
            }.bind(staticInterface);
                        
            // define on static interface
            if (!staticInterface[memberName]) {
                staticInterface[memberName] = _member;
            }
        }

        // normal
        if (!_member) { 
            _member = function(...args) {
                if (isArrow(memberDef)) { return memberDef(...args); } else { return memberDef.apply(obj, args); }
            }.bind(obj);
        }

        // return
        return _member;
    };
    const buildEvent = (memberName, memberDef) => {
        let _member = null,
            argsProcessorFn = null;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] !== 'function') { throw new _Exception('InvalidOperation', `Event is not found to override. (${memberName})`); }

            // wrap for base call
            let base = obj[memberName].bind(obj);
            _theFn = function(...args) {
                let fnArgs = [base].concat(args); // run fn with base as first parameter
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(obj, fnArgs); }
            }.bind(obj);
        }

        // duplicate check, if not overridden
        if (!_member && (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true))) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }

        // normal
        if (!_member) { 
            _member = function(...args) {
                if (isArrow(memberDef)) { return memberDef(...args); } else { return memberDef.apply(obj, args); }
            }.bind(obj);
        }

        if (!isNeedProtected) { // add event interface only on top level instance
            def.meta[memberName].argsProcessor = _member; // store event args processor function at top level
            _member = {};
            _member._ = Object.freeze({
                subscribers: []
            });
            _member.subscribe = (fn) => {
                if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                _member._.subscribers.push(fn);
            };
            _member.subscribe.all = () => {
                return _member._.subscribers.slice();
            };
            _member.unsubscribe = (fn) => {
                if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                let index = _member._.subscribers.indexOf(fn);
                if (index !== -1) { _member._.subscribers.splice(index, 1); }
            };
            _member.unsubscribe.all = () => {
                _member._.subscribers.length = 0; // remove all
            };
            _member.raise = (...args) => {
                // preprocess args
                let processedArgs = {},
                    argsProcessorFn = def.meta[memberName].argsProcessor;
                if (typeof argsProcessorFn === 'function') { processedArgs = argsProcessorFn(...args); }
        
                // define event arg
                let e = {
                    name: name,
                    args: Object.freeze(processedArgs),
                    stop: false
                };
        
                // raise event
                for(let handler of _member._.subscribers) {
                    handler(e);
                    if (e.stop) { break; }
                }
            };
            _member.rewire = (targetObj) => {
                // internal method that does not make outside, this is called
                // during exposed object building process to rewire event either as an object
                // or as a function - for external world it is an object without the ability of being
                // called, while for internal world (or derived types), it is a function, which can
                // be called to raise the event
                // this is self destructing method, and delete itself as well

                let eventAsFn = targetObj[name].raise;
                eventAsFn._ = targetObj[name]._;
                eventAsFn.subscribe = targetObj[name].subscribe; // .all comes with it
                eventAsFn.unsubscribe = targetObj[name].unsubscribe; // .all comes with it
                obj[name] = eventAsFn; // updating this internal object itself

                // on target object
                delete targetObj[name].raise;
                delete targetObj[name].rewire;
            }
        }

        // return
        return _member;
    };
    const addMember = (memberName, memberType, memberDef) => {
        if (['func', 'prop', 'event'].indexOf(memberType) !== -1 && member.isSpecial(memberName)) { new _Exception('InvalidName', `Name is not valid. (${memberName})`); }
        switch(memberType) {
            case 'func':
                if (!cfg.func) { throw new _Exception('InvalidOperation', `Function cannot be defined on this type. (${typeName})`); }
            case 'prop':
                if (!cfg.prop) { throw new _Exception('InvalidOperation', `Property cannot be defined on this type. (${typeName})`); }
            case 'event':
                if (!cfg.event) { throw new _Exception('InvalidOperation', `Event cannot be defined on this type. (${typeName})`); }
            case 'construct':
                if (!cfg.construct) { throw new _Exception('InvalidOperation', `Constructor cannot be defined on this type. (${typeName})`); }
                memberType = 'func'; break;
            case 'dispose':
                if (!cfg.dispose) { throw new _Exception('InvalidOperation', `Dispose cannot be defined on this type. (${typeName})`); }
                memberType = 'func'; break;
        }

        // pick mixin being applied at this time
        if (cfg.mixins) {        
            if (mixin_being_applied !== null) {
                _attr('mixed', mixin_being_applied);
            }
        }

        // TODO: store type of member at: def.types.members[name] = type
        // collect attributes
        def.meta[memberName] = _attr.collect(); // collect and clear for next bunch on next member
        def.meta[memberName].type = memberType;
        if (cfg.aop) {
            def.meta[name].aspects = []; // which all aspects are applied to this member
        }
        if (cfg.interfaces) {
            def.meta[name].interfaces = []; // to which all interfaces this member complies to
        }        

        // conditional check
        the_attr = attrs.get('conditional', memberName);
        if (the_attr && the_attr.args.length > 0) {
            let isOK = true;
            condition = attrArgs[0].trim();
            if (condition) {
                switch(condition) {
                    case 'server': isOK = (options.env.isServer === true); break;
                    case 'client': isOK = (options.env.isServer === false); break;
                    default: isOK = options.symbols.indexOf(condition) !== -1; break;
                }
                if (!isOK) { delete def.meta[memberName]; return; }
            }        
        }
        
        // abstract check
        if (cfg.interfaces && attrs.has('abstract', memberName) && memberDef !== _noop && (memberDef.get && memberDef.get !== _noop)) {
            if (memberType === 'prop') {
                throw new _Exception('InvalidDefinition', `Abstract property must have a noop getter function. (${memberName})`);
            } else if (memberType !== 'event') {
                throw new _Exception('InvalidDefinition', `Abstract event must be a noop function. (${memberName})`); 
            } else {
                throw new _Exception('InvalidDefinition', `Abstract function must be a noop function. (${memberName})`);
            }
        }


        // validate applied attributes as per attribute configuration
        for(let __attr of def.meta[memberName]) {
            // TODO: validation and throw logic
        }
   
        // member type specific logic
        let memberValue = null;
        switch(memberType) {
            case 'func':
                memberValue = buildFunc(memberName, memberDef);
                if (!(cfg.static && attrs.has('static', memberName))) { // define only when not static, don't define on this interface, its defined on static interface already
                    Object.defineProperty(obj, memberName, {
                        configurable: true, enumerable: true,
                        value: memberValue
                    });
                }
                break;
            case 'prop':
                memberValue = buildProp(memberName, memberDef);
                if (!(cfg.static && attrs.has('static', memberName))) { // define only when not static, don't define on this interface, its defined on static interface already                
                    Object.defineProperty(obj, memberName, {
                        configurable: true, enumerable: true,
                        get: memberValue.get, set: memberValue.set
                    });
                }
                break;
            case 'event':
                memberValue = buildEvent(memberName, memberDef);
                Object.defineProperty(obj, memberName, {
                    configurable: true, enumerable: true,
                    value: memberValue
                });
                break;
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            // TODO: Check Targets,  Fix and make it streamlined
            let Attr = null,
                targetType = def.meta[memberName].type,
                attrArgs = null,
                attrInstance = null,
                decorator = null;
            for(let info of def.meta[memberName]) {
                Attr = info.Attr;
                if (Attr) {
                    attrArgs = info.args || [];
                    attrInstance = new Attr(...attrArgs);
                    decorator = attrInstance.decorator(); // get decorator function
                    if (typeof decorator === 'function') {
                        let desc = Object.getOwnPropertyDescriptor(obj, memberName);
                        decorator(obj, targetType, memberName, desc);
                        Object.defineProperty(obj, memberName, desc);
                    } else {
                        throw new _Exception('NotDefined', `Decorator is not defined for applied attribute. (${info.name})`);
                    }
                } else {
                    // this could be an inbuilt attribute which are handled differently
                }
            }           
        }
        
        // finally hold the references for reflector
        def.meta[memberName].ref = memberValue;
    };
    const modifiers = modifiersRefl(def);
    const attrs = attrsRefl(def, obj);
 
    // process type level attributes
    attributesAndModifiers(true, def.types.type);

    // construct base object from parent, if applicable
    if (cfg.inheritance) {
        if (params.isTopLevelInstance) {
            if (modifiers.type.isAbstract()) { throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${def.name})`); }
        }

        // create parent instance, if required, else use passed object as base object
        let Parent = Type._.inherits;
        if (Parent) {
            if (Parent._.isSealed() || Parent._.isSingleton() || Parent._.isStatic()) {
                throw new _Exception('InvalidOperation', `Cannot inherit from a sealed, static or singleton type. (${Parent._.name})`); 
            }
            if (Parent._.type !== Type._.type) {
                throw new _Exception('InvalidOperation', `Cannot inherit from another type family. (${Parent._.type})`); 
            }
            obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object
        }
    }

     // set object meta
     if (typeof obj._ === 'undefined') {
        obj._ = {}; 
        obj._.id = guid();
        obj._.hierarchy = []; // will have: 'def' of each hierarchy level in order type is constructed
        obj._.isInstanceOf = (name) => {
            if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; } // could be the 'Type' itself
            return findIndexByProp(obj._.hierarchy, 'name', name) !== -1; // if this given type name found anywhere in hierarchy, so yes it is an instance of that type
        };
        obj._.def = () => { return obj._.hierarchy[obj._.hierarchy.length - 1]; }
        obj._.Type = () => { obj._.def().Type; }; // always gives top level, because that's what this is an instance of which comes to outside world
        if (cfg.serialize) {
            obj._.serialize = () => { return _Serializer.process(exposed_obj, exposed_obj, {}); };
            obj._.deserialize = (json) => { return _Serializer.process(exposed_obj, json, exposed_obj, true); };
        }
        if (cfg.mixins) {
            def.mixins = {
                types: cfg.params.mixins, // mixin types that were applied to this type
                names: namesOf(cfg.params.mixins)
            };
            obj._.isMixed = (name) => {
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; } // could be mixin type itself
                let result = false;
                for (let defItem of obj._.hierarchy) {
                    if (defItem.mixins.type.names.indexOf(name) !== -1) {
                        result = true; break;
                    }
                }
                return result;                    
            };        
        }
        if (cfg.interfaces) {
            def.interfaces = {
                types: cfg.params.interfaces, // interface types that were applied to this type
                names: namesOf(cfg.params.interfaces)
            };           
            obj._.isImplements = (name) => {
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; } // could be interface type itself
                let result = false;
                for (let defItem of obj._.hierarchy) {
                    if (defItem.interfaces.type.names.indexOf(name) !== -1) {
                        result = true; break;
                    }
                }
                return result;                   
            };        
        }
     }
     obj._.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
     obj._.hierarchy.push(def); // this level
    if (params.isTopLevelInstance) {
        obj._.modifiers = modifiers;
        obj._.attrs = attrs;
    }

    // building started
    isBuildingObj = true; 

    // define proxy for clean syntax inside factory
    proxy = new Proxy({}, {
        get: (_obj, prop) => { return obj[prop]; },
        set: (_obj, prop, value) => {
            if (isBuildingObj) {
                // get member type
                let memberType = '';
                if (prop === 'construct') { 
                    memberType = 'construct'; 
                } else if (prop === 'dispose') { 
                    memberType = 'dispose'; 
                } else {
                    if (typeof value === 'function') {
                        if (_attr.has('event')) { 
                            memberType = 'event'; 
                        } else { 
                            memberType = 'func'; 
                        }
                    } else { 
                        memberType = 'prop'; 
                    }
                }
                
                // add member
                addMember(prop, memberType, value);
            } else {
                // a function or event is being redefined
                if (typeof value === 'function') { throw new _Exception('InvalidOperation', `Redefinition of members at runtime is not allowed. (${prop})`); }

                // allow setting property values
                obj[prop] = value;
            }
            return true;
        }
    });

    // construct using factory having 'this' being proxy object
    params.factory.apply(proxy);

    // apply mixins
    if (cfg.mixins) { 
        for(let mixin of def.mixins.types) {
            mixin_being_applied = mixin;
            mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
            mixin_being_applied = null;
        }
    }    

    // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
    _attr.clear();

    // building ends
    isBuildingObj = false; 

    // weave advices from aspects
    if (cfg.aop) {
        // TODO: as per new type
        // when not on base types of this functionality itself
        if (['Attribute', 'Aspect'].indexOf(cfg.params.typeName) === -1 && 
            !obj._.isInstanceOf('Attribute') && !obj._.isInstanceOf('Aspect')) { 
            let weavedFn = null;
            for(let member in meta) {
                if (meta.hasOwnProperty(memb) && meta[memb].type === 'func' && !member.isSpecial(memb)) {
                    // get weaved function
                    weavedFn = _Aspects(obj, cfg.params.typeName, memb, meta[memb]);

                    // store aspects applied
                    meta[memb].aspects = weavedFn.aspects;
                    delete weavedFn.aspects;
                    
                    // redefine function
                    Object.defineProperty(obj, memb, {
                        configurable: true,
                        enumerable: true,
                        value: weavedFn
                    });
                }
            }
        }       
    }

    // move constructor and dispose out of main object
    if (cfg.construct && typeof obj[_constructName] === 'function') {
        obj._.construct = obj[_constructName]; delete obj[_constructName];
    }
    if (cfg.dispose && typeof obj[_disposeName] === 'function') {
        obj._.dispose = obj[_disposeName]; delete obj[_disposeName];
    }  

    // prepare protected and public interfaces of object
    let isCopy = false,
        doCopy = (memberName) => { Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName)); };
    doCopy('_'); // copy meta member
    for(let memberName in obj) { // copy other members
        // TODO: fix as per new type
        isCopy = false;
        if (obj.hasOwnProperty(memberName)) { 
            isCopy = true;
            if (member.isOwn(memberName)) {
                if (member.isPrivate(memberName)) { isCopy = false; }   // private members don't get out
                if (isCopy && (member.isProtected(memberName) && !params.isNeedProtected)) { isCopy = false; } // protected don't go out of top level instance
            } else { // some derived member (protected or public)
                if (member.isProtected(memberName) && !params.isNeedProtected) { isCopy = false; } // protected don't go out of top level instance
                if (isCopy && !member.isDerived(memberName)) { isCopy = false; } // some directly added member
            }
            if (isCopy) { doCopy(memberName); }
            // rewire event definition when at the top level object creation step
            if (isCopy && !params.isNeedProtected && member.isEvent(memberName)) {
                exposed_obj[memberName].rewire(exposed_obj);
            }
        }
    }

    // validate interfaces of type
    if (cfg.interfaces) {
        for(let _interfaceType of def.interfaces.types) { 
            // an interface define members just like a type
            // with but its function and event will be noop and
            // property values will be null
            let _interface = new _interfaceType(), // so we get to read members of interface
                _interfaceInternalDef = _interface._.hierarchy.Current();
            for(let _memberName in _interface) {
                if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                    if (exposed_obj[_memberName]) {
                        let _interfaceMemberType = _interfaceInternalDef.types.members[_memberName],
                            _memberTypeHere = def.types.members[_memberName];
                        if (_interfaceMemberType !== _memberTypeHere) { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as ${_interfaceMemberType}. (${_memberName})`); }
                    }
                }
            }
        }
    }

    // call constructor
    if (cfg.construct && params.isTopLevelInstance && typeof exposed_obj._[_constructName] === 'function') {
        exposed_obj._.constructing = true;
        exposed_obj._[_constructName](...params.args);
        delete exposed_obj._.constructing;
    }

    // add/update meta on top level instance
    if (params.isTopLevelInstance) {
        if (cfg.singleton && attrs.type.has('singleton')) {
            Type._.singleInstance = () => { return exposed_obj; }; 
            Type._.singleInstance.clear = () => { 
                Type._.singleInstance = () => { return null; };
            };
        }
    }

    // seal object, so nothing can be added/deleted from outside
    // also, keep protected version intact for 
    if (params.isTopLevelInstance) {
        exposed_obj = Object.seal(exposed_obj);
    }

    // return
    return exposed_obj;
};
const builder = (cfg) => {
    // fix cfg
    cfg.mixins = cfg.mixins || false;
    cfg.interfaces = cfg.interfaces || false;
    cfg.inheritance = cfg.inheritance || false;
    cfg.singleton = cfg.singleton || false;
    cfg.static = cfg.static || false;
    cfg.func = cfg.func || false;
    cfg.construct = cfg.construct || false;
    cfg.dispose = cfg.dispose || false;
    cfg.prop = cfg.prop || false;
    cfg.storage = cfg.storage || false;
    cfg.event = cfg.event || false;
    cfg.aop = cfg.aop || false;
    cfg.customAttrs = cfg.customAttrs || false;
    cfg.serialize = cfg.serialize || false;
    cfg.types.instance = cfg.types.instance || 'unknown';
    cfg.types.type = cfg.types.type || 'unknown';
    cfg.params.typeName = cfg.params.typeName || 'unknown';
    cfg.params.inherits = cfg.params.inherits || null;
    cfg.params.mixins = [];
    cfg.params.interfaces = [];
    cfg.params.factory = cfg.params.factory || null;
    if (!cfg.func) {
        cfg.construct = false;
        cfg.dispose = false;
    }
    if (!cfg.prop) {
        cfg.storage = false;
    }
    if (!cfg.inheritance) {
        cfg.singleton = false;
    }
    if (!cfg.func && !cfg.prop && !cfg.event) {
        cfg.aop = false;
        cfg.customAttrs = false;
    }

    // extract mixins and interfaces
    for(let item of cfg.params.mixinsAndInterfaces) {
       if (item._ && item._.type) {
            switch (item._.type) {
                case 'mixin': cfg.params.mixins.push(item); break;
                case 'interface': cfg.params.interfaces.push(item); break;
            }
       }
    }
    delete cfg.params.mixinsAndInterfaces;

    // top level definitions
    let _flagName = '___flag___';

    // base type definition
    let _Object = function(_flag, _static, ...args) {
        // define parameters and context
        let params = {
            _flagName: _flagName
        };
        if (typeof _flag !== 'undefined' && _flag === _flagName) { // inheritance in play
            params.isNeedProtected = true;
            params.isTopLevelInstance = false;
            params.staticInterface = _static;
            params.args = args;
        } else {
            params.isNeedProtected = false;
            params.isTopLevelInstance = true;
            params.staticInterface = _Object;
            if (typeof _flag !== 'undefined') {
                if (typeof _static !== 'undefined') {
                    params.args = [_flag, _static].concat(args); // one set
                } else {
                    params.args = [_flag]; // no other args given
                }
            } else {
                params.args = []; // no args
            }
        }

        // base object
        let _this = {};

        // build instance
        return buildTypeInstance(cfg, _Object, params, _this);
    };

    // type def
    let typeDef = { 
        name: cfg.params.typeName,
        Type: _Object,
        types: {
            type: cfg.types.type, // the type of the type itself: class, struct, etc.
        },
        attrs: { 
            type: [], // will have: {name, cfg, attr, args}
        },
        modifiers: {
            type: [], // will have: {name, cfg, attr, args}
        }
    };
    const modifiers = modifiersRefl(typeDef);
    const attrs = attrsRefl(typeDef, null);

    // type level attributes pick here (as well)
    isSkipClear = true;
    attributesAndModifiers(typeDef, true);
    isSkipClear = false;

    // set type meta
    _Object._.name = cfg.params.typeName;
    _Object._.type = cfg.types.type;
    _Object._.id = guid();
    _Object._.namespace = null;
    _Object._.assembly = () => { return _Assembly.get(_Object._.name) || null; };
    _Object._.inherits = cfg.params.inherits || null;
    if (cfg.inheritance) {
        _Object._.isAbstract = modifiers.type.isAbstract;
        _Object._.isSealed = modifiers.type.isSealed;
        _Object._.isDerivedFrom = (name) => { // TODO: fix as per new
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }
            let result = (name === 'Object'),
                prv = params.inherits;
            if (!result) {
                // eslint-disable-next-line no-constant-condition
                while(true) {
                    if (prv === null) { break; }
                    if (prv._.name === name) { result = true; break; }
                    prv = prv._.inherits;
                }
            }
            return result;
        };
    }
    if (cfg.static) {
        _Object._.isStatic = modifiers.type.isStatic;
    }
    if (cfg.singleton) {
        _Object._.isSingleton = attrs.type.isSingleton;
        _Object._.singleInstance = () => { return null; }
        _Object._.singleInstance.clear = noop;
    }
    if (cfg.mixins) {
        typeDef.mixins = {
            types: cfg.params.mixins, // mixin types that were applied to this type
            names: namesOf(cfg.params.mixins)
        };        
        _Object._.isMixed = (name) => { // TODO: fix as per new
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }

            let result = false,
                prv = Type,
                _mixins = [];
            // eslint-disable-next-line no-constant-condition
            while(true) {
                if (prv === null) { break; }
                _mixins = prv._._.mixins;
                for(let mixin of _mixins) {
                    if (mixin._.name === name) {
                        result = true; break;
                    }
                }
                if (result) { 
                    break;
                } else {
                    prv = prv._.inherits; 
                }
            }
            return result;
        };
    }
    if (cfg.interfaces) {
        typeDef.interfaces = {
            types: cfg.params.interfaces, // interface types that were applied to this type
            names: namesOf(cfg.params.interfaces)
        };          
        _Object._.isImplements = (name) => { // TODO: fix as per new
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }

            let result = false,
                prv = Type,
                _interfaces = [];
            // eslint-disable-next-line no-constant-condition
            while(true) {
                if (prv === null) { break; }
                _interfaces = prv._._.interfaces;
                for(let intf of _interfaces) {
                    if (intf._.name === name) {
                        result = true; break;
                    }
                }
                if (result) { 
                    break;
                } else {
                    prv = prv._.inherits; 
                }
            }
            return result;
        };                
    }
    _Object._.isDeprecated = attrs.type.isDeprecated;
    _Object._.def = () => { return typeDef; }
    _Object._.modifiers = modifiers;
    _Object._.attrs = attrs;

    // register type with namespace
    _Namespace(_Object); 

    // return 
    if (_Object._.isStatic()) {
        return new _Object();
    } else { // return type
        return _Object;
    }
};
