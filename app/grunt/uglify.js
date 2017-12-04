'use strict';

var conservativeOptions = {
    // Custom optimizations to avoid bugs:
    // - #709: use of Function.name by Models/Activities;
    //compress: false,
    compress: {
        sequences     : false,  // join consecutive statemets with the “comma operator”
        properties    : true,  // optimize property access: a["foo"] → a.foo
        dead_code     : true,  // discard unreachable code
        drop_debugger : true,  // discard “debugger” statements
        unsafe        : false, // some unsafe optimizations (see below)
        conditionals  : true,  // optimize if-s and conditional expressions
        comparisons   : true,  // optimize comparisons
        evaluate      : true,  // evaluate constant expressions
        booleans      : true,  // optimize boolean expressions
        loops         : true,  // optimize loops
        // Iago: Additionally to drop unused vars/funcs, it drops the functions names too
        // causing the bug #709 (we use Function.name).
        // I had set-up jshint to notify about actual unused bars/funcs so
        // compression stage is not reach if that happens.
        unused        : false, // drop unused variables/functions
        hoist_funs    : true,  // hoist function declarations. This fix some strict mode violations, caused by other optimizations.
        hoist_vars    : false, // hoist variable declarations
        keep_fargs    : true,  // Avoid that mangle remove unused func args
        keep_fnames   : true,  // Avoid that mangle remove function names. This allows enable mangling without causing the bug #709
        if_return     : true,  // optimize if-s followed by return/continue
        join_vars     : true,  // join var declarations
        cascade       : true,  // try to cascade `right` into `left` in sequences
        side_effects  : true,  // drop side-effect-free statements
        warnings      : true,  // warn about potentially dangerous optimizations/code
        global_defs   : {}     // global definitions
    },
    //report: 'gzip',

    // To look for compression warnings only:
    /*compress: {
        warnings: true
    },*/

    // Reduce variable names
    // IMPORTANT: Disabled because it causes bugs, even now that keep_fnames:true fixes #709 seems to
    // break other things. Continue reviewing
    // Know problem: entering the serviceProfessionalService activity shows bug of 'double knockout binding'
    mangle: false
};

module.exports = {
    'appCommon': {
        'options': conservativeOptions,
        'files': {
            './build/assets/js/common.min.js': ['./build/assets/js/common.js'],
            './build/assets/js/app.min.js': ['./build/assets/js/app.js'],
            './build/assets/js/welcome.min.js': ['./build/assets/js/welcome.js']
        }
    }
};
