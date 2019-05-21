/**
 * @preserve
 * Preamble for assemblies at: ./
 * Created: Tue, 21 May 2019 02:01:09 GMT
 */
(function(root, loader) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(loader);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = loader; // Node.js specific module.exports
        }
        module.exports = exports = loader; // CommonJS        
    } else { // expose as global on window
        root['flair.preamble'] = loader; // always overwrites
    }
})(this, async function(flair) {
    'use strict';

    flair.AppDomain.registerAdo(JSON.parse('{"name":"flair","file":"./flair{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.8.47","lupdate":"Tue, 21 May 2019 02:01:06 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["Aspect","Attribute","IDisposable","IProgressReporter","Task"],"resources":[],"assets":[],"routes":[]}'));
	flair.AppDomain.registerAdo(JSON.parse('{"name":"flair.app","file":"./flair.app{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.8.47","lupdate":"Tue, 21 May 2019 02:01:08 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.Bootware","flair.app.Handler","flair.app.App","flair.app.Host","flair.ui.ViewHandler","flair.ui.Page","flair.api.RestHandler","flair.api.RestInterceptor","flair.app.BootEngine","flair.app.ClientHost","flair.app.ServerHost","flair.boot.ClientRouter","flair.boot.DIContainer","flair.boot.Middlewares","flair.boot.NodeEnv","flair.boot.ResHeaders","flair.boot.ServerRouter","flair.ui.ViewInterceptor","flair.ui.ViewState","flair.ui.ViewTransition"],"resources":[],"assets":[],"routes":[]}'));
	flair.AppDomain.registerAdo(JSON.parse('{"name":"flair.vue","file":"./flair.vue{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.8.47","lupdate":"Tue, 21 May 2019 02:01:09 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponentMembers","flair.boot.vue.VueSetup","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[]}'));

});