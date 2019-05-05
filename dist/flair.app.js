/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.app
 *     File: ./flair.app.js
 *  Version: 0.50.54
 *  Sun, 05 May 2019 14:13:37 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
				Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
				isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
				getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
const { TaskInfo } = flair.Tasks;
const { env } = flair.options;
const DOC = ((env.isServer || env.isWorker) ? null : window.document);
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
				b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
				$$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
				$$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;

// define current context name
const __currentContextName = AppDomain.context.current().name;

// define loadPathOf this assembly
let __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
let __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
AppDomain.loadPathOf('flair.app', __currentPath);

// assembly level error handler
const __asmError = (err) => { AppDomain.onError(err); };
/* eslint-enable no-unused-vars */

// load assembly settings from settings file
let settings = JSON.parse('{"host":"flair.app.ServerHost | flair.app.ClientHost","app":"flair.app.App","load":[],"container":{}}'); // eslint-disable-line no-unused-vars
let settingsReader = flair.Port('settingsReader');
if (typeof settingsReader === 'function') {
let externalSettings = settingsReader('flair.app');
if (externalSettings) { settings = Object.assign(settings, externalSettings); }}
settings = Object.freeze(settings);

// default assembly config
let config = {}; // eslint-disable-line no-unused-vars
config = Object.freeze(config);


// ./src/flair.app/functions.js (start)
// global handler
let onLoadComplete = () => {
};
// ./src/flair.app/functions.js (end)

AppDomain.context.current().currentAssemblyBeingLoaded('./flair.app{.min}.js');

try{

(async () => { // ./src/flair.app/flair.app/@1-Bootware.js
try{
/**
 * @name Bootware
 * @description Bootware base class
 */
$$('abstract');
$$('ns', 'flair.app');
Class('Bootware', function() {
    /**  
     * @name construct
     * @arguments
     *  name: string - name of the bootware
     *  version: string - version number of the bootware
    */
    $$('virtual');
    this.construct = (name, version, isMountSpecific) => {
        let args = Args('name: string, version: string',
                        'name: string, version: string, isMountSpecific: boolean',
                        'name: string, isMountSpecific: boolean',
                        'name: string')(name, version, isMountSpecific); args.throwOnError(this.construct);

        // set info
        this.info = Object.freeze({
            name: args.values.name || '',
            version: args.values.version || '',
            isMountSpecific: args.values.isMountSpecific || false
        });
    };

    /**  
     * @name boot
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.boot = noop;

    $$('readonly');
    this.info = null;

    /**  
     * @name ready
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.ready = noop;

    $$('virtual');
    this.dispose = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.app/flair.app/@10-Handler.js
try{

const { IDisposable } = ns();

/**
 * @name Handler
 * @description Handler base class
 */
$$('ns', 'flair.app');
Class('Handler', [IDisposable], function() {
    $$('virtual');
    this.construct = () => {
    };

    $$('virtual');
    this.dispose = () => {
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.app/flair.app/@20-App.js
try{
const { IDisposable } = ns();
const { Bootware } = ns('flair.app');

/**
 * @name App
 * @description App base class
 */
$$('ns', 'flair.app');
Class('App', Bootware, [IDisposable], function() {
    $$('override');
    this.construct = (base) => {
        // set info
        let asm = getAssembly(this);
        base(asm.title, asm.version);
    };
    
    $$('override');
    this.boot = async (base) => {
        base();
        AppDomain.host().error.add(this.onError); // host's errors are handled here
    };

    $$('virtual');
    this.start = async () => {
        // initialize view state
        if (!env.isServer && !env.isWorker) {
            const { ViewState } = ns('flair.ui');
            new ViewState(); // this initializes the global view state store's persistance via this singleton object
        }
    };

    $$('virtual');
    this.stop = async () => {
        // clear view state
        if (!env.isServer && !env.isWorker) {
            const { ViewState } = ns('flair.ui');
            new ViewState().clear();
        }
    };

    $$('virtual');
    this.onError = (e) => {
        throw Exception.OperationFailed(e.error, this.onError);
    };

    $$('override');
    this.dispose = () => {
        AppDomain.host().error.remove(this.onError); // remove error handler
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.app/flair.app/@30-Host.js
try{
const { IDisposable } = ns();
const { Bootware } = ns('flair.app');

/**
 * @name App
 * @description App base class
 */
$$('ns', 'flair.app');
Class('Host', Bootware, [IDisposable], function() {
    $$('privateSet');
    this.isStarted = false;

    $$('virtual');
    this.start = async () => {
        this.isStarted = true;
    };

    $$('virtual');
    this.stop = async () => {
        this.isStarted = false;
    };

    this.restart = async () => {
        await this.stop();
        await this.start();
    };

    this.error = event((err) => {
        return { error: err };
    });
    
    this.raiseError = (err) => {
        this.error(err);
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.app/flair.app/BootEngine.js
try{
const { Bootware } = ns('flair.app');

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', 'flair.app');
Class('BootEngine', function() {
    this.start = async function () {
        let allBootwares = [],
            mountSpecificBootwares = [];
        const loadFilesAndBootwares = async () => {
            // load bootwares, scripts and preambles
            let Item = null,
                Bw = null,
                bw = null;
            for(let item of settings.load) {
                // get bootware (it could be a bootware, a simple script or a preamble)
                item = which(item); // server/client specific version
                if (item) { // in case no item is set for either server/client
                    Item = await include(item);
                    if (Item && typeof Item !== 'boolean') {
                        Bw = as(Item, Bootware);
                        if (Bw) { // if boot
                            bw = new Bw(); 
                            allBootwares.push(bw); // push in array, so boot and ready would be called for them
                            if (bw.info.isMountSpecific) { // if bootware is mount specific bootware - means can run once for each mount
                                mountSpecificBootwares.push(bw);
                            }
                        } // else ignore, this was something else, like a module which was just loaded
                    } // else ignore, as it could just be a file loaded which does not return anything
                }
            }
        };
        const runBootwares = async (method) => {
            if (!env.isWorker) { // main env
                let mounts = AppDomain.host().mounts,
                    mountNames = Object.keys(mounts),
                    mountName = '',
                    mount = null;
            
                // run all bootwares for main
                mountName = 'main';
                mount = mounts[mountName];
                for(let bw of allBootwares) {
                    await bw[method](mount);
                }

                // run all bootwares which are mount specific for all other mounts (except main)
                for(let mountName of mountNames) {
                    if (mountName === 'main') { continue; }
                    mount = mounts[mountName];
                    for(let bw of mountSpecificBootwares) {
                        await bw[method](mount);
                    }
                }
            } else { // worker env
                // in this case as per load[] setting, no nountspecific bootwares should be present
                if (mountSpecificBootwares.length !== 0) { 
                    console.warn('Mount specific bootwares are not supported for worker environment. Revisit worker:flair.app->load setting.'); // eslint-disable-line no-console
                }

                // run all for once (ignoring the mountspecific ones)
                for(let bw of allBootwares) {
                    if (!bw.info.isMountSpecific) {
                        await bw[method]();
                    }
                }
            }
        };
        const boot = async () => {
            if (!env.isWorker) {
                let host = which(settings.host), // pick server/client specific host
                    Host = as(await include(host), Bootware),
                    hostObj = null;
                if (!Host) { throw Exception.InvalidDefinition(host, this.start); }
                hostObj = new Host();
                await hostObj.boot();
                AppDomain.host(hostObj); // set host
            }
            
            await runBootwares('boot');   
            
            let app = which(settings.app), // pick server/client specific host
            App = as(await include(app), Bootware),
            appObj = null;
            if (!App) { throw Exception.InvalidDefinition(app, this.start); }
            appObj = new App();
            await appObj.boot();
            AppDomain.app(appObj); // set app
        };        
        const start = async () => {
            if (!env.isWorker) {
                await AppDomain.host().start();
            }
            await AppDomain.app().start();
        };
        const DOMReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                if( document.readyState !== 'loading' ) {
                    resolve();
                } else {
                    window.document.addEventListener("DOMContentLoaded", () => {
                        resolve();
                    });
                }
            });
        };
        const DeviceReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                window.document.addEventListener('deviceready', () => {
                    // NOTE: even if the device was already ready, registering for this event will immediately fire it
                    resolve();
                }, false);
            });
        };
        const ready = async () => {
            if (env.isClient && !env.isWorker) {
                await DOMReady();
                if (env.isCordova) { await DeviceReady(); }
            }

            if (!env.isWorker) {
                await AppDomain.host().ready();
            }
            await runBootwares('ready');
            await AppDomain.app().ready();
        };
          
        await loadFilesAndBootwares();
        await boot();
        await start();
        await ready();
        console.log('ready!'); // eslint-disable-line no-console
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.app/flair.boot/DIContainer.js
try{
const { Bootware } = ns('flair.app');

/**
 * @name DIContainer
 * @description Initialize DI Container
 */
$$('sealed');
$$('ns', 'flair.boot');
Class('DIContainer', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('DI Container');
    };

    $$('override');
    this.boot = async () => {
        let containerItems = settings.container;
        for(let alias in containerItems) {
            if (containerItems.hasOwnProperty(alias)) {
                Container.register(alias, containerItems[alias]);
            }
        }
    };
});
} catch(err) {
	__asmError(err);
}
})();

} catch(err) {
	__asmError(err);
}

AppDomain.context.current().currentAssemblyBeingLoaded('');

AppDomain.registerAdo('{"name":"flair.app","file":"./flair.app{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.54","lupdate":"Sun, 05 May 2019 14:13:37 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.Bootware","flair.app.Handler","flair.app.App","flair.app.Host","flair.app.BootEngine","flair.boot.DIContainer"],"resources":[],"assets":[],"routes":[]}');

if(typeof onLoadComplete === 'function'){ onLoadComplete(); onLoadComplete = noop; } // eslint-disable-line no-undef

})();
