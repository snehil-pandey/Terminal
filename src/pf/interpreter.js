/**
 * Panfam Programming Language (.pf) - Tree-Walk Virtual Interpreter
 * Executes .pf AST without eval() or new Function().
 * Supports lexical scope, function closures, class instantiation,
 * standard library modules (std.io, std.math, std.system), and error reporting.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const ParserModule = require('./parser');
        module.exports = factory(ParserModule);
    } else {
        root.PFInterpreter = factory(root.PFParser);
    }
})(typeof self !== 'undefined' ? self : this, function (ParserModule) {
    'use strict';

    class ReturnSignal {
        constructor(value) {
            this.value = value;
        }
    }

    class Environment {
        constructor(parent = null) {
            this.values = new Map();
            this.parent = parent;
        }

        define(name, value) {
            this.values.set(name, value);
        }

        assign(name, value) {
            if (this.values.has(name)) {
                this.values.set(name, value);
                return;
            }
            if (this.parent) {
                this.parent.assign(name, value);
                return;
            }
            this.values.set(name, value);
        }

        get(name) {
            if (this.values.has(name)) {
                return this.values.get(name);
            }
            if (this.parent) {
                return this.parent.get(name);
            }
            return undefined;
        }
    }

    class PFClass {
        constructor(name, methods = [], superclass = null, interfaces = []) {
            this.name = name;
            this.methods = methods;
            this.superclass = superclass; // PFClass instance or null
            this.interfaces = interfaces;
        }

        findMethod(name) {
            const method = this.methods.find(m => m.name === name);
            if (method) return method;
            if (this.superclass && typeof this.superclass.findMethod === 'function') {
                return this.superclass.findMethod(name);
            }
            return undefined;
        }

        instantiate(args, interpreter) {
            const instance = new PFInstance(this);
            const initMethod = this.findMethod('init');
            if (initMethod) {
                const methodEnv = new Environment(interpreter.globalEnv);
                methodEnv.define('self', instance);
                initMethod.params.forEach((param, idx) => {
                    if (param !== 'self') methodEnv.define(param, args[idx]);
                });
                interpreter.executeBlock(initMethod.body, methodEnv);
            }
            return instance;
        }
    }

    class PFInstance {
        constructor(pfClass) {
            this.pfClass = pfClass;
            this.fields = new Map();
        }

        get(name) {
            if (this.fields.has(name)) return this.fields.get(name);
            const method = this.pfClass.findMethod(name);
            if (method) return method;
            return undefined;
        }

        set(name, value) {
            this.fields.set(name, value);
        }
    }

    class Interpreter {
        constructor(outputCallback = null, kernel = null) {
            this.output = outputCallback || ((str) => console.log(str));
            this.kernel = kernel;
            this.globalEnv = new Environment();
            this.initStdLib();
        }

        initStdLib() {
            // Builtin print function
            this.globalEnv.define('print', (...args) => {
                const line = args.map(a => {
                    if (a instanceof PFInstance) return `<Instance of ${a.pfClass.name}>`;
                    return a !== undefined ? String(a) : 'null';
                }).join(' ');
                this.output(line);
                return line;
            });

            // std.math
            this.globalEnv.define('math', {
                sqrt: (n) => Math.sqrt(n),
                abs: (n) => Math.abs(n),
                floor: (n) => Math.floor(n),
                ceil: (n) => Math.ceil(n),
                pi: Math.PI
            });

            // std.system
            this.globalEnv.define('system', {
                uname: () => this.kernel ? this.kernel.sys_uname() : { name: 'Panfam OS' },
                meminfo: () => this.kernel ? this.kernel.sys_meminfo() : { totalMiB: 8192 },
                cpuinfo: () => this.kernel ? this.kernel.sys_cpuinfo() : { cores: 4 }
            });

            // std.string
            this.globalEnv.define('string', {
                length: (s) => (s != null ? String(s).length : 0),
                upper: (s) => (s != null ? String(s).toUpperCase() : ''),
                lower: (s) => (s != null ? String(s).toLowerCase() : ''),
                trim: (s) => (s != null ? String(s).trim() : ''),
                split: (s, sep) => (s != null ? String(s).split(sep) : []),
                join: (arr, sep) => (Array.isArray(arr) ? arr.join(sep) : ''),
                replace: (s, find, rep) => (s != null ? String(s).replace(find, rep) : ''),
                includes: (s, sub) => (s != null ? String(s).includes(sub) : false),
                startsWith: (s, prefix) => (s != null ? String(s).startsWith(prefix) : false),
                endsWith: (s, suffix) => (s != null ? String(s).endsWith(suffix) : false)
            });

            // std.collections
            this.globalEnv.define('collections', {
                list: () => [],
                map: () => ({}),
                set: () => [],
                size: (coll) => (Array.isArray(coll) ? coll.length : (coll && typeof coll === 'object' ? Object.keys(coll).length : 0)),
                push: (arr, val) => { if (Array.isArray(arr)) arr.push(val); return arr; },
                pop: (arr) => (Array.isArray(arr) ? arr.pop() : null),
                keys: (obj) => (obj && typeof obj === 'object' ? Object.keys(obj) : []),
                has: (coll, val) => (Array.isArray(coll) ? coll.includes(val) : (coll && typeof coll === 'object' ? (val in coll) : false)),
                setAdd: (arr, val) => { if (Array.isArray(arr) && !arr.includes(val)) arr.push(val); return arr; }
            });

            // std.time
            this.globalEnv.define('time', {
                now: () => Date.now(),
                iso: () => new Date().toISOString(),
                sleep: (ms) => {
                    const start = Date.now();
                    while (Date.now() - start < ms) { /* sync tick bounded */ }
                    return ms;
                }
            });

            // Bind namespaced std object for consistency with std.io, std.math, etc.
            const stdObj = {
                io: {
                    print: this.globalEnv.get('print'),
                    write: (s) => this.output(String(s))
                },
                math: this.globalEnv.get('math'),
                string: this.globalEnv.get('string'),
                collections: this.globalEnv.get('collections'),
                time: this.globalEnv.get('time'),
                system: this.globalEnv.get('system')
            };
            this.globalEnv.define('std', stdObj);
        }

        run(sourceCode) {
            const program = ParserModule.parseSource(sourceCode);
            return this.execute(program);
        }

        execute(program) {
            let lastResult = null;
            for (const stmt of program.body) {
                lastResult = this.executeStatement(stmt, this.globalEnv);
            }
            return lastResult;
        }

        executeStatement(stmt, env) {
            if (!stmt) return null;

            if (stmt.type === 'VarDecl') {
                const val = stmt.init ? this.evaluate(stmt.init, env) : null;
                env.define(stmt.name, val);
                return val;
            }

            if (stmt.type === 'FuncDecl') {
                env.define(stmt.name, stmt);
                return stmt;
            }

            if (stmt.type === 'ClassDecl') {
                let supercls = null;
                if (stmt.superclass) {
                    supercls = env.get(stmt.superclass);
                }
                const cls = new PFClass(stmt.name, stmt.methods, supercls, stmt.interfaces);
                env.define(stmt.name, cls);
                return cls;
            }

            if (stmt.type === 'IfStmt') {
                const cond = this.evaluate(stmt.condition, env);
                if (cond) {
                    return this.executeBlock(stmt.thenBranch, env);
                } else if (stmt.elseBranch) {
                    return this.executeBlock(stmt.elseBranch, env);
                }
                return null;
            }

            if (stmt.type === 'WhileStmt') {
                let res = null;
                let iterations = 0;
                while (this.evaluate(stmt.condition, env)) {
                    if (++iterations > 50000) throw new Error('Runtime Error: Execution limit exceeded (Infinite loop guard)');
                    res = this.executeBlock(stmt.body, env);
                }
                return res;
            }

            if (stmt.type === 'ReturnStmt') {
                const val = stmt.value ? this.evaluate(stmt.value, env) : null;
                throw new ReturnSignal(val);
            }

            if (stmt.type === 'TryStmt') {
                let res = null;
                try {
                    res = this.executeBlock(stmt.tryBlock, env);
                } catch (err) {
                    if (err instanceof ReturnSignal) {
                        throw err;
                    }
                    if (stmt.catchBlock) {
                        const catchEnv = new Environment(env);
                        if (stmt.catchParam) {
                            catchEnv.define(stmt.catchParam, err.message !== undefined ? err.message : err);
                        }
                        res = this.executeBlock(stmt.catchBlock, catchEnv);
                    } else {
                        throw err;
                    }
                } finally {
                    if (stmt.finallyBlock) {
                        this.executeBlock(stmt.finallyBlock, env);
                    }
                }
                return res;
            }

            if (stmt.type === 'ThrowStmt') {
                const thrownVal = this.evaluate(stmt.expression, env);
                throw (thrownVal instanceof Error ? thrownVal : new Error(String(thrownVal)));
            }

            if (stmt.type === 'BlockStmt') {
                return this.executeBlock(stmt, new Environment(env));
            }

            if (stmt.type === 'ExprStmt') {
                return this.evaluate(stmt.expression, env);
            }

            return null;
        }

        executeBlock(block, env) {
            let res = null;
            for (const s of block.statements) {
                res = this.executeStatement(s, env);
            }
            return res;
        }

        evaluate(expr, env) {
            if (!expr) return null;

            if (expr.type === 'SuperExpr') {
                const selfInstance = env.get('self');
                if (!selfInstance || !(selfInstance instanceof PFInstance)) {
                    throw new Error("Runtime Error: 'super' referenced outside of class instance context");
                }
                const superclass = selfInstance.pfClass.superclass;
                if (!superclass) {
                    throw new Error(`Runtime Error: Class '${selfInstance.pfClass.name}' does not have a superclass`);
                }
                const superMethod = superclass.findMethod(expr.method);
                if (!superMethod) {
                    throw new Error(`Runtime Error: Super method '${expr.method}' not found`);
                }
                const evaluatedArgs = expr.args.map(a => this.evaluate(a, env));
                const callEnv = new Environment(this.globalEnv);
                callEnv.define('self', selfInstance);
                superMethod.params.forEach((param, idx) => {
                    if (param !== 'self') callEnv.define(param, evaluatedArgs[idx]);
                });
                try {
                    this.executeBlock(superMethod.body, callEnv);
                } catch (signal) {
                    if (signal instanceof ReturnSignal) return signal.value;
                    throw signal;
                }
                return null;
            }

            if (expr.type === 'AssignExpr') {
                const val = this.evaluate(expr.value, env);
                if (expr.target.type === 'Identifier') {
                    env.assign(expr.target.name, val);
                    return val;
                }
                if (expr.target.type === 'MemberExpr') {
                    const obj = this.evaluate(expr.target.object, env);
                    const prop = expr.target.property;
                    if (obj instanceof PFInstance) {
                        obj.set(prop, val);
                        return val;
                    }
                    if (obj && typeof obj === 'object') {
                        obj[prop] = val;
                        return val;
                    }
                }
                return val;
            }

            if (expr.type === 'Literal') return expr.value;

            if (expr.type === 'Identifier') {
                return env.get(expr.name);
            }

            if (expr.type === 'BinaryExpr') {
                const left = this.evaluate(expr.left, env);
                const right = this.evaluate(expr.right, env);
                switch (expr.op) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return right !== 0 ? left / right : 0;
                    case '%': return left % right;
                    case '==': return left === right;
                    case '!=': return left !== right;
                    case '<': return left < right;
                    case '>': return left > right;
                    case '<=': return left <= right;
                    case '>=': return left >= right;
                    default: return null;
                }
            }

            if (expr.type === 'MemberExpr') {
                const obj = this.evaluate(expr.object, env);
                if (obj && typeof obj === 'object') {
                    if (obj instanceof PFInstance) return obj.get(expr.property);
                    return obj[expr.property];
                }
                return undefined;
            }

            if (expr.type === 'CallExpr') {
                const evaluatedArgs = expr.args.map(a => this.evaluate(a, env));

                // Member method call or instance creation
                if (expr.callee.type === 'Identifier') {
                    const funcOrClass = env.get(expr.callee.name);
                    if (funcOrClass instanceof PFClass) {
                        return funcOrClass.instantiate(evaluatedArgs, this);
                    }
                    if (typeof funcOrClass === 'function') {
                        return funcOrClass(...evaluatedArgs);
                    }
                    if (funcOrClass && funcOrClass.type === 'FuncDecl') {
                        const callEnv = new Environment(this.globalEnv);
                        funcOrClass.params.forEach((param, idx) => {
                            callEnv.define(param, evaluatedArgs[idx]);
                        });
                        try {
                            this.executeBlock(funcOrClass.body, callEnv);
                        } catch (signal) {
                            if (signal instanceof ReturnSignal) return signal.value;
                            throw signal;
                        }
                        return null;
                    }
                } else if (expr.callee.type === 'MemberExpr') {
                    const obj = this.evaluate(expr.callee.object, env);
                    const prop = expr.callee.property;

                    if (obj instanceof PFInstance) {
                        const method = obj.get(prop);
                        if (method && method.type === 'FuncDecl') {
                            const callEnv = new Environment(this.globalEnv);
                            callEnv.define('self', obj);
                            method.params.forEach((param, idx) => {
                                if (param !== 'self') callEnv.define(param, evaluatedArgs[idx]);
                            });
                            try {
                                this.executeBlock(method.body, callEnv);
                            } catch (signal) {
                                if (signal instanceof ReturnSignal) return signal.value;
                                throw signal;
                            }
                            return null;
                        }
                    }

                    if (obj && typeof obj[prop] === 'function') {
                        return obj[prop](...evaluatedArgs);
                    }
                }
            }

            return null;
        }
    }

    return {
        Interpreter: Interpreter,
        Environment: Environment,
        PFClass: PFClass,
        PFInstance: PFInstance
    };
});
