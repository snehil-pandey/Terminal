/**
 * Panfam Programming Language (.pf) - Static Type Checker
 * Performs compile-time static type analysis, type inference,
 * assignment compatibility checks, class field/method checks,
 * and diagnostic error reporting with source locations.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const ParserModule = require('./parser');
        module.exports = factory(ParserModule);
    } else {
        root.PFTypeChecker = factory(root.PFParser);
    }
})(typeof self !== 'undefined' ? self : this, function (ParserModule) {
    'use strict';

    const Types = {
        INTEGER: 'Integer',
        FLOAT: 'Float',
        STRING: 'String',
        BOOLEAN: 'Boolean',
        ANY: 'Any',
        VOID: 'Void',
        UNKNOWN: 'Unknown'
    };

    class Diagnostic {
        constructor(message, line = 1, column = 1, severity = 'error', filename = 'main.pf') {
            this.message = message;
            this.line = line;
            this.column = column;
            this.severity = severity;
            this.filename = filename;
        }

        toString() {
            return `[${this.severity.toUpperCase()}] ${this.filename}:${this.line}:${this.column} - ${this.message}`;
        }
    }

    class TypeEnvironment {
        constructor(parent = null) {
            this.types = new Map();
            this.parent = parent;
        }

        define(name, type) {
            this.types.set(name, type);
        }

        get(name) {
            if (this.types.has(name)) return this.types.get(name);
            if (this.parent) return this.parent.get(name);
            return null;
        }
    }

    class TypeChecker {
        constructor(filename = 'main.pf') {
            this.filename = filename;
            this.diagnostics = [];
            this.classes = new Map();
            this.interfaces = new Map();
            this.globalEnv = new TypeEnvironment();
            this.initGlobals();
        }

        initGlobals() {
            // Builtin global functions
            this.globalEnv.define('print', { kind: 'function', params: [Types.ANY], returnType: Types.VOID });
            this.globalEnv.define('math', { kind: 'module', types: {
                sqrt: { kind: 'function', params: [Types.FLOAT], returnType: Types.FLOAT },
                abs: { kind: 'function', params: [Types.FLOAT], returnType: Types.FLOAT },
                floor: { kind: 'function', params: [Types.FLOAT], returnType: Types.INTEGER },
                ceil: { kind: 'function', params: [Types.FLOAT], returnType: Types.INTEGER }
            }});
            this.globalEnv.define('string', { kind: 'module', types: {
                length: { kind: 'function', params: [Types.STRING], returnType: Types.INTEGER },
                upper: { kind: 'function', params: [Types.STRING], returnType: Types.STRING },
                lower: { kind: 'function', params: [Types.STRING], returnType: Types.STRING },
                trim: { kind: 'function', params: [Types.STRING], returnType: Types.STRING }
            }});
        }

        check(programOrSource) {
            this.diagnostics = [];
            let ast = programOrSource;
            if (typeof programOrSource === 'string') {
                ast = ParserModule.parseSource(programOrSource);
            }

            if (!ast || ast.type !== 'Program') return { valid: false, diagnostics: [new Diagnostic('Invalid AST passed to type checker', 1, 1, 'error', this.filename)] };

            // Pass 1: Collect class and interface declarations
            for (const stmt of ast.body) {
                if (stmt.type === 'ClassDecl') {
                    this.classes.set(stmt.name, stmt);
                    this.globalEnv.define(stmt.name, { kind: 'class', name: stmt.name, superclass: stmt.superclass });
                } else if (stmt.type === 'InterfaceDecl') {
                    this.interfaces.set(stmt.name, stmt);
                    this.globalEnv.define(stmt.name, { kind: 'interface', name: stmt.name });
                }
            }

            // Pass 2: Typecheck statements
            for (const stmt of ast.body) {
                this.checkStatement(stmt, this.globalEnv);
            }

            return {
                valid: this.diagnostics.length === 0,
                diagnostics: this.diagnostics
            };
        }

        checkStatement(stmt, env) {
            if (!stmt) return;

            if (stmt.type === 'VarDecl') {
                let inferredType = Types.UNKNOWN;
                if (stmt.init) {
                    inferredType = this.inferExpressionType(stmt.init, env);
                }

                const declaredType = stmt.typeAnnotation || inferredType;
                if (stmt.typeAnnotation && inferredType !== Types.UNKNOWN && inferredType !== Types.ANY) {
                    if (!this.isAssignable(declaredType, inferredType)) {
                        this.diagnostics.push(new Diagnostic(
                            `Type mismatch: Cannot assign '${inferredType}' to declared type '${declaredType}' for variable '${stmt.name}'`,
                            1, 1, 'error', this.filename
                        ));
                    }
                }
                env.define(stmt.name, declaredType);
                return;
            }

            if (stmt.type === 'FuncDecl') {
                const funcEnv = new TypeEnvironment(env);
                stmt.params.forEach(p => funcEnv.define(p, Types.ANY));
                env.define(stmt.name, { kind: 'function', params: stmt.params.map(() => Types.ANY), returnType: stmt.returnType || Types.VOID });
                this.checkBlock(stmt.body, funcEnv, stmt.returnType || Types.VOID);
                return;
            }

            if (stmt.type === 'ClassDecl') {
                if (stmt.superclass && !this.classes.has(stmt.superclass)) {
                    this.diagnostics.push(new Diagnostic(
                        `Cannot find superclass '${stmt.superclass}' for class '${stmt.name}'`,
                        1, 1, 'error', this.filename
                    ));
                }

                for (const ifaceName of stmt.interfaces) {
                    if (!this.interfaces.has(ifaceName)) {
                        this.diagnostics.push(new Diagnostic(
                            `Cannot find interface '${ifaceName}' implemented by '${stmt.name}'`,
                            1, 1, 'error', this.filename
                        ));
                    }
                }

                const classEnv = new TypeEnvironment(env);
                classEnv.define('self', { kind: 'class_instance', className: stmt.name });
                stmt.fields.forEach(f => classEnv.define(f, Types.ANY));

                for (const m of stmt.methods) {
                    const methodEnv = new TypeEnvironment(classEnv);
                    m.params.forEach(p => {
                        if (p !== 'self') methodEnv.define(p, Types.ANY);
                    });
                    this.checkBlock(m.body, methodEnv, m.returnType || Types.VOID);
                }
                return;
            }

            if (stmt.type === 'IfStmt') {
                this.checkBlock(stmt.thenBranch, env);
                if (stmt.elseBranch) this.checkBlock(stmt.elseBranch, env);
                return;
            }

            if (stmt.type === 'WhileStmt') {
                this.checkBlock(stmt.body, env);
                return;
            }

            if (stmt.type === 'TryStmt') {
                this.checkBlock(stmt.tryBlock, env);
                if (stmt.catchBlock) {
                    const catchEnv = new TypeEnvironment(env);
                    if (stmt.catchParam) catchEnv.define(stmt.catchParam, Types.STRING);
                    this.checkBlock(stmt.catchBlock, catchEnv);
                }
                if (stmt.finallyBlock) {
                    this.checkBlock(stmt.finallyBlock, env);
                }
                return;
            }

            if (stmt.type === 'ThrowStmt') {
                this.inferExpressionType(stmt.expression, env);
                return;
            }

            if (stmt.type === 'ExprStmt') {
                this.inferExpressionType(stmt.expression, env);
                return;
            }
        }

        checkBlock(block, env, expectedReturnType = null) {
            if (!block || !block.statements) return;
            const blockEnv = new TypeEnvironment(env);
            for (const s of block.statements) {
                if (s.type === 'ReturnStmt') {
                    if (expectedReturnType && expectedReturnType !== Types.VOID && expectedReturnType !== 'void') {
                        const retType = s.value ? this.inferExpressionType(s.value, blockEnv) : Types.VOID;
                        if (!this.isAssignable(expectedReturnType, retType)) {
                            this.diagnostics.push(new Diagnostic(
                                `Return type mismatch: Function expects '${expectedReturnType}' but returned '${retType}'`,
                                1, 1, 'error', this.filename
                            ));
                        }
                    }
                } else {
                    this.checkStatement(s, blockEnv);
                }
            }
        }

        inferExpressionType(expr, env) {
            if (!expr) return Types.UNKNOWN;

            if (expr.type === 'Literal') {
                if (typeof expr.value === 'number') {
                    return Number.isInteger(expr.value) ? Types.INTEGER : Types.FLOAT;
                }
                if (typeof expr.value === 'string') return Types.STRING;
                if (typeof expr.value === 'boolean') return Types.BOOLEAN;
                if (expr.value === null) return Types.ANY;
            }

            if (expr.type === 'Identifier') {
                const t = env.get(expr.name);
                if (t) return typeof t === 'string' ? t : (t.className || Types.ANY);
                return Types.UNKNOWN;
            }

            if (expr.type === 'BinaryExpr') {
                const left = this.inferExpressionType(expr.left, env);
                const right = this.inferExpressionType(expr.right, env);
                if (['==', '!=', '<', '>', '<=', '>='].includes(expr.op)) {
                    return Types.BOOLEAN;
                }
                if (left === Types.STRING || right === Types.STRING) {
                    return Types.STRING;
                }
                if (left === Types.FLOAT || right === Types.FLOAT) {
                    return Types.FLOAT;
                }
                if (left === Types.INTEGER && right === Types.INTEGER) {
                    return Types.INTEGER;
                }
                return Types.ANY;
            }

            if (expr.type === 'AssignExpr') {
                const rightType = this.inferExpressionType(expr.value, env);
                if (expr.target.type === 'Identifier') {
                    const targetType = env.get(expr.target.name);
                    if (targetType && typeof targetType === 'string' && targetType !== Types.ANY && !this.isAssignable(targetType, rightType)) {
                        this.diagnostics.push(new Diagnostic(
                            `Type mismatch in assignment: Cannot assign '${rightType}' to variable '${expr.target.name}' of type '${targetType}'`,
                            1, 1, 'error', this.filename
                        ));
                    }
                }
                return rightType;
            }

            if (expr.type === 'CallExpr') {
                return Types.ANY;
            }

            return Types.ANY;
        }

        isAssignable(targetType, fromType) {
            if (targetType === Types.ANY || fromType === Types.ANY) return true;
            if (targetType === fromType) return true;
            // Integer is assignable to Float
            if (targetType === Types.FLOAT && fromType === Types.INTEGER) return true;
            return false;
        }
    }

    return {
        Types: Types,
        Diagnostic: Diagnostic,
        TypeChecker: TypeChecker,
        check: (source, filename = 'main.pf') => {
            const checker = new TypeChecker(filename);
            return checker.check(source);
        }
    };
});
