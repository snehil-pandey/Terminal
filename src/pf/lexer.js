/**
 * Panfam Programming Language (.pf) - Lexical Analyzer
 * Tokenizes keywords (class, function, let, if, else, while, for, in, return, try, catch,
 * import, async, await, true, false, null), symbols, identifiers, literals, and operators.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFLexer = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const TokenType = {
        // Keywords
        CLASS: 'CLASS',
        FUNCTION: 'FUNCTION',
        LET: 'LET',
        CONST: 'CONST',
        IF: 'IF',
        ELSE: 'ELSE',
        WHILE: 'WHILE',
        FOR: 'FOR',
        IN: 'IN',
        RETURN: 'RETURN',
        TRY: 'TRY',
        CATCH: 'CATCH',
        FINALLY: 'FINALLY',
        IMPORT: 'IMPORT',
        ASYNC: 'ASYNC',
        AWAIT: 'AWAIT',
        NEW: 'NEW',
        SELF: 'SELF',
        INIT: 'INIT',
        TRUE: 'TRUE',
        FALSE: 'FALSE',
        NULL: 'NULL',

        // Types
        TYPE_STRING: 'TYPE_STRING',
        TYPE_INT: 'TYPE_INT',
        TYPE_FLOAT: 'TYPE_FLOAT',
        TYPE_BOOL: 'TYPE_BOOL',

        // Literals & Identifiers
        IDENTIFIER: 'IDENTIFIER',
        NUMBER: 'NUMBER',
        STRING: 'STRING',

        // Operators & Delimiters
        ASSIGN: 'ASSIGN',         // =
        PLUS: 'PLUS',             // +
        MINUS: 'MINUS',           // -
        STAR: 'STAR',             // *
        SLASH: 'SLASH',           // /
        MODULO: 'MODULO',         // %
        EQ: 'EQ',                 // ==
        NOT_EQ: 'NOT_EQ',         // !=
        LT: 'LT',                 // <
        GT: 'GT',                 // >
        LTE: 'LTE',               // <=
        GTE: 'GTE',               // >=
        ARROW: 'ARROW',           // ->
        COLON: 'COLON',           // :
        DOT: 'DOT',               // .
        COMMA: 'COMMA',           // ,
        LPAREN: 'LPAREN',         // (
        RPAREN: 'RPAREN',         // )
        LBRACKET: 'LBRACKET',     // [
        RBRACKET: 'RBRACKET',     // ]
        LBRACE: 'LBRACE',         // {
        RBRACE: 'RBRACE',         // }
        NEWLINE: 'NEWLINE',
        EOF: 'EOF'
    };

    const KEYWORDS = {
        'class': TokenType.CLASS,
        'function': TokenType.FUNCTION,
        'let': TokenType.LET,
        'const': TokenType.CONST,
        'if': TokenType.IF,
        'else': TokenType.ELSE,
        'while': TokenType.WHILE,
        'for': TokenType.FOR,
        'in': TokenType.IN,
        'return': TokenType.RETURN,
        'try': TokenType.TRY,
        'catch': TokenType.CATCH,
        'finally': TokenType.FINALLY,
        'import': TokenType.IMPORT,
        'async': TokenType.ASYNC,
        'await': TokenType.AWAIT,
        'new': TokenType.NEW,
        'self': TokenType.SELF,
        'init': TokenType.INIT,
        'true': TokenType.TRUE,
        'false': TokenType.FALSE,
        'null': TokenType.NULL,
        'String': TokenType.TYPE_STRING,
        'Integer': TokenType.TYPE_INT,
        'Float': TokenType.TYPE_FLOAT,
        'Boolean': TokenType.TYPE_BOOL
    };

    class Token {
        constructor(type, value, line, col) {
            this.type = type;
            this.value = value;
            this.line = line;
            this.col = col;
        }
    }

    class Lexer {
        constructor(source) {
            this.source = source || '';
            this.pos = 0;
            this.line = 1;
            this.col = 1;
            this.len = this.source.length;
        }

        peek() {
            return this.pos < this.len ? this.source[this.pos] : null;
        }

        peekNext() {
            return (this.pos + 1 < this.len) ? this.source[this.pos + 1] : null;
        }

        next() {
            if (this.pos >= this.len) return null;
            const c = this.source[this.pos++];
            if (c === '\n') {
                this.line++;
                this.col = 1;
            } else {
                this.col++;
            }
            return c;
        }

        tokenize() {
            const tokens = [];

            while (this.pos < this.len) {
                const c = this.peek();

                // Skip horizontal whitespace
                if (c === ' ' || c === '\t' || c === '\r') {
                    this.next();
                    continue;
                }

                // Handle single-line comments // or #
                if ((c === '/' && this.peekNext() === '/') || c === '#') {
                    while (this.pos < this.len && this.peek() !== '\n') {
                        this.next();
                    }
                    continue;
                }

                const line = this.line;
                const col = this.col;

                // Newlines
                if (c === '\n') {
                    this.next();
                    tokens.push(new Token(TokenType.NEWLINE, '\n', line, col));
                    continue;
                }

                // Numbers
                if (/[0-9]/.test(c)) {
                    let numStr = '';
                    while (this.pos < this.len && /[0-9.]/.test(this.peek())) {
                        numStr += this.next();
                    }
                    tokens.push(new Token(TokenType.NUMBER, parseFloat(numStr), line, col));
                    continue;
                }

                // Strings (double or single quotes)
                if (c === '"' || c === "'") {
                    const quote = this.next();
                    let str = '';
                    while (this.pos < this.len && this.peek() !== quote) {
                        if (this.peek() === '\\') {
                            this.next();
                            const esc = this.next();
                            if (esc === 'n') str += '\n';
                            else if (esc === 't') str += '\t';
                            else str += esc;
                        } else {
                            str += this.next();
                        }
                    }
                    this.next(); // consume closing quote
                    tokens.push(new Token(TokenType.STRING, str, line, col));
                    continue;
                }

                // Multi-char operators
                if (c === '-' && this.peekNext() === '>') {
                    this.next(); this.next();
                    tokens.push(new Token(TokenType.ARROW, '->', line, col));
                    continue;
                }
                if (c === '=' && this.peekNext() === '=') {
                    this.next(); this.next();
                    tokens.push(new Token(TokenType.EQ, '==', line, col));
                    continue;
                }
                if (c === '!' && this.peekNext() === '=') {
                    this.next(); this.next();
                    tokens.push(new Token(TokenType.NOT_EQ, '!=', line, col));
                    continue;
                }
                if (c === '<' && this.peekNext() === '=') {
                    this.next(); this.next();
                    tokens.push(new Token(TokenType.LTE, '<=', line, col));
                    continue;
                }
                if (c === '>' && this.peekNext() === '=') {
                    this.next(); this.next();
                    tokens.push(new Token(TokenType.GTE, '>=', line, col));
                    continue;
                }

                // Single-char operators
                if (c === '=') { this.next(); tokens.push(new Token(TokenType.ASSIGN, '=', line, col)); continue; }
                if (c === '+') { this.next(); tokens.push(new Token(TokenType.PLUS, '+', line, col)); continue; }
                if (c === '-') { this.next(); tokens.push(new Token(TokenType.MINUS, '-', line, col)); continue; }
                if (c === '*') { this.next(); tokens.push(new Token(TokenType.STAR, '*', line, col)); continue; }
                if (c === '/') { this.next(); tokens.push(new Token(TokenType.SLASH, '/', line, col)); continue; }
                if (c === '%') { this.next(); tokens.push(new Token(TokenType.MODULO, '%', line, col)); continue; }
                if (c === '<') { this.next(); tokens.push(new Token(TokenType.LT, '<', line, col)); continue; }
                if (c === '>') { this.next(); tokens.push(new Token(TokenType.GT, '>', line, col)); continue; }
                if (c === ':') { this.next(); tokens.push(new Token(TokenType.COLON, ':', line, col)); continue; }
                if (c === '.') { this.next(); tokens.push(new Token(TokenType.DOT, '.', line, col)); continue; }
                if (c === ',') { this.next(); tokens.push(new Token(TokenType.COMMA, ',', line, col)); continue; }
                if (c === '(') { this.next(); tokens.push(new Token(TokenType.LPAREN, '(', line, col)); continue; }
                if (c === ')') { this.next(); tokens.push(new Token(TokenType.RPAREN, ')', line, col)); continue; }
                if (c === '[') { this.next(); tokens.push(new Token(TokenType.LBRACKET, '[', line, col)); continue; }
                if (c === ']') { this.next(); tokens.push(new Token(TokenType.RBRACKET, ']', line, col)); continue; }
                if (c === '{') { this.next(); tokens.push(new Token(TokenType.LBRACE, '{', line, col)); continue; }
                if (c === '}') { this.next(); tokens.push(new Token(TokenType.RBRACE, '}', line, col)); continue; }

                // Identifiers & Keywords
                if (/[a-zA-Z_]/.test(c)) {
                    let id = '';
                    while (this.pos < this.len && /[a-zA-Z0-9_]/.test(this.peek())) {
                        id += this.next();
                    }
                    const kwType = KEYWORDS[id];
                    if (kwType) {
                        tokens.push(new Token(kwType, id, line, col));
                    } else {
                        tokens.push(new Token(TokenType.IDENTIFIER, id, line, col));
                    }
                    continue;
                }

                // Unknown character fallback
                this.next();
            }

            tokens.push(new Token(TokenType.EOF, '', this.line, this.col));
            return tokens;
        }
    }

    return {
        TokenType: TokenType,
        Token: Token,
        Lexer: Lexer
    };
});
