/**
 * Panfam Programming Language (.pf) - Parser & AST
 * Builds AST representation of programs: ClassDecl, FuncDecl, VarDecl,
 * IfStmt, WhileStmt, ReturnStmt, BinaryExpr, CallExpr, MemberExpr.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const LexerModule = require('./lexer');
        module.exports = factory(LexerModule);
    } else {
        root.PFParser = factory(root.PFLexer);
    }
})(typeof self !== 'undefined' ? self : this, function (LexerModule) {
    'use strict';

    const { TokenType, Lexer } = LexerModule;

    // AST Nodes
    class Program { constructor(body = []) { this.type = 'Program'; this.body = body; } }
    class VarDecl { constructor(name, typeAnnotation, init) { this.type = 'VarDecl'; this.name = name; this.typeAnnotation = typeAnnotation; this.init = init; } }
    class FuncDecl { constructor(name, params, returnType, body) { this.type = 'FuncDecl'; this.name = name; this.params = params; this.returnType = returnType; this.body = body; } }
    class ClassDecl { constructor(name, methods = [], fields = []) { this.type = 'ClassDecl'; this.name = name; this.methods = methods; this.fields = fields; } }
    class IfStmt { constructor(condition, thenBranch, elseBranch) { this.type = 'IfStmt'; this.condition = condition; this.thenBranch = thenBranch; this.elseBranch = elseBranch; } }
    class WhileStmt { constructor(condition, body) { this.type = 'WhileStmt'; this.condition = condition; this.body = body; } }
    class ReturnStmt { constructor(value) { this.type = 'ReturnStmt'; this.value = value; } }
    class BlockStmt { constructor(statements = []) { this.type = 'BlockStmt'; this.statements = statements; } }
    class ExprStmt { constructor(expression) { this.type = 'ExprStmt'; this.expression = expression; } }
    class BinaryExpr { constructor(left, op, right) { this.type = 'BinaryExpr'; this.left = left; this.op = op; this.right = right; } }
    class CallExpr { constructor(callee, args = []) { this.type = 'CallExpr'; this.callee = callee; this.args = args; } }
    class MemberExpr { constructor(object, property) { this.type = 'MemberExpr'; this.object = object; this.property = property; } }
    class Literal { constructor(value) { this.type = 'Literal'; this.value = value; } }
    class Identifier { constructor(name) { this.type = 'Identifier'; this.name = name; } }

    class AssignExpr { constructor(target, value) { this.type = 'AssignExpr'; this.target = target; this.value = value; } }

    class Parser {
        constructor(tokens) {
            // Filter out redundant consecutive newlines
            this.tokens = tokens.filter((t, idx, arr) => {
                if (t.type === TokenType.NEWLINE) {
                    return idx === 0 || arr[idx - 1].type !== TokenType.NEWLINE;
                }
                return true;
            });
            this.pos = 0;
        }

        peek() {
            return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
        }

        next() {
            return this.pos < this.tokens.length ? this.tokens[this.pos++] : null;
        }

        match(...types) {
            const token = this.peek();
            if (token && types.includes(token.type)) {
                return this.next();
            }
            return null;
        }

        consumeNewlines() {
            while (this.peek() && this.peek().type === TokenType.NEWLINE) {
                this.next();
            }
        }

        parse() {
            const statements = [];
            this.consumeNewlines();
            while (this.peek() && this.peek().type !== TokenType.EOF) {
                const stmt = this.parseStatement();
                if (stmt) statements.push(stmt);
                this.consumeNewlines();
            }
            return new Program(statements);
        }

        parseStatement() {
            this.consumeNewlines();
            const token = this.peek();
            if (!token || token.type === TokenType.EOF) return null;

            if (token.type === TokenType.CLASS) return this.parseClass();
            if (token.type === TokenType.FUNCTION) return this.parseFunction();
            if (token.type === TokenType.LET || token.type === TokenType.CONST) return this.parseVarDecl();
            if (token.type === TokenType.IF) return this.parseIf();
            if (token.type === TokenType.WHILE) return this.parseWhile();
            if (token.type === TokenType.RETURN) return this.parseReturn();
            if (token.type === TokenType.LBRACE) return this.parseBlock();

            return this.parseExprStmt();
        }

        parseClass() {
            this.next(); // consume 'class'
            const name = this.next().value;
            this.match(TokenType.COLON); // optional colon
            this.consumeNewlines();
            const hasBrace = this.match(TokenType.LBRACE);

            const methods = [];
            const fields = [];

            while (this.peek() && this.peek().type !== TokenType.EOF) {
                if (hasBrace && this.peek().type === TokenType.RBRACE) break;
                this.consumeNewlines();
                if (this.peek().type === TokenType.FUNCTION || this.peek().type === TokenType.INIT) {
                    methods.push(this.parseFunction());
                } else if (this.peek().type === TokenType.LET || this.peek().type === TokenType.IDENTIFIER) {
                    const fName = this.next().value;
                    fields.push(fName);
                } else {
                    break;
                }
                this.consumeNewlines();
            }
            if (hasBrace) this.match(TokenType.RBRACE);
            return new ClassDecl(name, methods, fields);
        }

        parseFunction() {
            const isInit = this.match(TokenType.INIT);
            let name = 'init';
            if (!isInit) {
                this.next(); // consume 'function'
                name = this.next().value;
            }

            this.match(TokenType.LPAREN);
            const params = [];
            while (this.peek() && this.peek().type !== TokenType.RPAREN) {
                if (this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.SELF) {
                    params.push(this.next().value);
                }
                this.match(TokenType.COMMA);
            }
            this.match(TokenType.RPAREN);

            // Optional return type `-> Type`
            let retType = 'void';
            if (this.match(TokenType.ARROW)) {
                retType = this.next().value;
            }
            this.match(TokenType.COLON);
            this.consumeNewlines();

            const body = this.parseBlock();
            return new FuncDecl(name, params, retType, body);
        }

        parseVarDecl() {
            this.next(); // consume 'let' or 'const'
            const name = this.next().value;
            let typeAnnot = null;
            if (this.match(TokenType.COLON)) {
                typeAnnot = this.next().value;
            }
            this.match(TokenType.ASSIGN);
            const init = this.parseExpression();
            return new VarDecl(name, typeAnnot, init);
        }

        parseIf() {
            this.next(); // consume 'if'
            const cond = this.parseExpression();
            this.match(TokenType.COLON);
            this.consumeNewlines();
            const thenBranch = this.parseBlock();

            let elseBranch = null;
            this.consumeNewlines();
            if (this.match(TokenType.ELSE)) {
                this.match(TokenType.COLON);
                this.consumeNewlines();
                elseBranch = this.parseBlock();
            }
            return new IfStmt(cond, thenBranch, elseBranch);
        }

        parseWhile() {
            this.next(); // consume 'while'
            const cond = this.parseExpression();
            this.match(TokenType.COLON);
            this.consumeNewlines();
            const body = this.parseBlock();
            return new WhileStmt(cond, body);
        }

        parseReturn() {
            this.next(); // consume 'return'
            let value = null;
            if (this.peek() && this.peek().type !== TokenType.NEWLINE && this.peek().type !== TokenType.EOF) {
                value = this.parseExpression();
            }
            return new ReturnStmt(value);
        }

        parseBlock() {
            if (this.match(TokenType.LBRACE)) {
                const stmts = [];
                while (this.peek() && this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
                    const s = this.parseStatement();
                    if (s) stmts.push(s);
                    this.consumeNewlines();
                }
                this.match(TokenType.RBRACE);
                return new BlockStmt(stmts);
            }

            // Single line block statement
            const single = this.parseStatement();
            return new BlockStmt(single ? [single] : []);
        }

        parseExprStmt() {
            const expr = this.parseExpression();
            return new ExprStmt(expr);
        }

        parseExpression() {
            const expr = this.parseEquality();
            if (this.match(TokenType.ASSIGN)) {
                const val = this.parseExpression();
                return new AssignExpr(expr, val);
            }
            return expr;
        }

        parseEquality() {
            let left = this.parseComparison();
            while (this.peek() && (this.peek().type === TokenType.EQ || this.peek().type === TokenType.NOT_EQ)) {
                const op = this.next().value;
                const right = this.parseComparison();
                left = new BinaryExpr(left, op, right);
            }
            return left;
        }

        parseComparison() {
            let left = this.parseAdditive();
            while (this.peek() && [TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE].includes(this.peek().type)) {
                const op = this.next().value;
                const right = this.parseAdditive();
                left = new BinaryExpr(left, op, right);
            }
            return left;
        }

        parseAdditive() {
            let left = this.parseMultiplicative();
            while (this.peek() && (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS)) {
                const op = this.next().value;
                const right = this.parseMultiplicative();
                left = new BinaryExpr(left, op, right);
            }
            return left;
        }

        parseMultiplicative() {
            let left = this.parsePrimary();
            while (this.peek() && [TokenType.STAR, TokenType.SLASH, TokenType.MODULO].includes(this.peek().type)) {
                const op = this.next().value;
                const right = this.parsePrimary();
                left = new BinaryExpr(left, op, right);
            }
            return left;
        }

        parsePrimary() {
            const token = this.peek();
            if (!token) return null;

            if (token.type === TokenType.NUMBER || token.type === TokenType.STRING) {
                return new Literal(this.next().value);
            }
            if (token.type === TokenType.TRUE) { this.next(); return new Literal(true); }
            if (token.type === TokenType.FALSE) { this.next(); return new Literal(false); }
            if (token.type === TokenType.NULL) { this.next(); return new Literal(null); }

            if (token.type === TokenType.IDENTIFIER || token.type === TokenType.SELF) {
                let expr = new Identifier(this.next().value);

                // Handle member access or call chains
                while (this.peek()) {
                    if (this.match(TokenType.DOT)) {
                        const prop = this.next().value;
                        expr = new MemberExpr(expr, prop);
                    } else if (this.match(TokenType.LPAREN)) {
                        const args = [];
                        while (this.peek() && this.peek().type !== TokenType.RPAREN) {
                            args.push(this.parseExpression());
                            this.match(TokenType.COMMA);
                        }
                        this.match(TokenType.RPAREN);
                        expr = new CallExpr(expr, args);
                    } else {
                        break;
                    }
                }
                return expr;
            }

            if (this.match(TokenType.LPAREN)) {
                const expr = this.parseExpression();
                this.match(TokenType.RPAREN);
                return expr;
            }

            this.next(); // fallback consume
            return null;
        }
    }

    return {
        Parser: Parser,
        parseSource: (src) => {
            const lexer = new Lexer(src);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            return parser.parse();
        }
    };
});
