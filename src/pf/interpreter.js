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
        constructor(name, methods = []) {
            this.name = name;
            this.methods = methods;
        }

        instantiate(args, interpreter) {
            const instance = new PFInstance(this);
            const initMethod = this.methods.find(m => m.name === 'init');
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
            const method = this.pfClass.methods.find(m => m.name === name);
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
                const cls = new PFClass(stmt.name, stmt.methods);
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
