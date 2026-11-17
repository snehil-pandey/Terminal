/**
 * Panfam-Terminal POSIX Lexer
 * Lexical Analyzer supporting single quotes, double quotes, escape characters,
 * operators (;, &&, ||, |, <, >, >>, 2>, 2>&1), and variable expressions.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TerminalLexer = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const TokenType = {
        WORD: 'WORD',
        PIPE: 'PIPE',           // |
        AND_IF: 'AND_IF',       // &&
        OR_IF: 'OR_IF',         // ||
        SEMICOLON: 'SEMICOLON', // ;
        REDIR_IN: 'REDIR_IN',   // <
        REDIR_OUT: 'REDIR_OUT', // >
        REDIR_APPEND: 'REDIR_APPEND', // >>
        REDIR_ERR: 'REDIR_ERR', // 2>
        REDIR_ERR_MERGE: 'REDIR_ERR_MERGE', // 2>&1
        EOF: 'EOF'
    };

    class Token {
        constructor(type, value, start, end) {
            this.type = type;
            this.value = value;
            this.start = start;
            this.end = end;
        }
    }

    class Lexer {
        constructor(input) {
            this.input = input || '';
            this.pos = 0;
            this.len = this.input.length;
        }

        peek() {
            return this.pos < this.len ? this.input[this.pos] : null;
        }

        next() {
            return this.pos < this.len ? this.input[this.pos++] : null;
        }

        skipWhitespace() {
            while (this.pos < this.len && /\s/.test(this.input[this.pos])) {
                this.pos++;
            }
        }

        tokenize() {
            const tokens = [];
            while (true) {
                this.skipWhitespace();
                if (this.pos >= this.len) {
                    tokens.push(new Token(TokenType.EOF, '', this.pos, this.pos));
                    break;
                }

                const start = this.pos;
                const char = this.peek();

                // Check operators
                if (char === ';') {
                    this.next();
                    tokens.push(new Token(TokenType.SEMICOLON, ';', start, this.pos));
                    continue;
                }

                if (char === '|') {
                    this.next();
                    if (this.peek() === '|') {
                        this.next();
                        tokens.push(new Token(TokenType.OR_IF, '||', start, this.pos));
                    } else {
                        tokens.push(new Token(TokenType.PIPE, '|', start, this.pos));
                    }
                    continue;
                }

                if (char === '&') {
                    this.next();
                    if (this.peek() === '&') {
                        this.next();
                        tokens.push(new Token(TokenType.AND_IF, '&&', start, this.pos));
                        continue;
                    }
                    // Standalone & treated as word or background placeholder
                    tokens.push(new Token(TokenType.WORD, '&', start, this.pos));
                    continue;
                }

                if (char === '<') {
                    this.next();
                    tokens.push(new Token(TokenType.REDIR_IN, '<', start, this.pos));
                    continue;
                }

                if (char === '>') {
                    this.next();
                    if (this.peek() === '>') {
                        this.next();
                        tokens.push(new Token(TokenType.REDIR_APPEND, '>>', start, this.pos));
                    } else {
                        tokens.push(new Token(TokenType.REDIR_OUT, '>', start, this.pos));
                    }
                    continue;
                }

                // Check 2>&1 or 2>
                if (char === '2' && this.input.substring(this.pos, this.pos + 4) === '2>&1') {
                    this.pos += 4;
                    tokens.push(new Token(TokenType.REDIR_ERR_MERGE, '2>&1', start, this.pos));
                    continue;
                }
                if (char === '2' && this.input.substring(this.pos, this.pos + 2) === '2>') {
                    this.pos += 2;
                    tokens.push(new Token(TokenType.REDIR_ERR, '2>', start, this.pos));
                    continue;
                }

                // Word token (including single quotes, double quotes, escapes)
                const word = this.readWord();
                tokens.push(new Token(TokenType.WORD, word, start, this.pos));
            }
            return tokens;
        }

        readWord() {
            let buffer = '';
            let inSingleQuote = false;
            let inDoubleQuote = false;

            while (this.pos < this.len) {
                const c = this.peek();

                // If not in quotes and encountered operator or whitespace, break word
                if (!inSingleQuote && !inDoubleQuote) {
                    if (/\s/.test(c) || c === ';' || c === '|' || c === '&' || c === '<' || c === '>') {
                        break;
                    }
                    if (c === '2' && (this.input.startsWith('2>', this.pos) || this.input.startsWith('2>&1', this.pos))) {
                        break;
                    }
                }

                // Single quotes: preserve literally until closing single quote
                if (c === "'" && !inDoubleQuote) {
                    inSingleQuote = !inSingleQuote;
                    this.next();
                    continue;
                }

                // Double quotes: allow escaping
                if (c === '"' && !inSingleQuote) {
                    inDoubleQuote = !inDoubleQuote;
                    this.next();
                    continue;
                }

                // Backslash escape
                if (c === '\\') {
                    this.next(); // consume backslash
                    if (this.pos < this.len) {
                        buffer += this.next();
                    }
                    continue;
                }

                buffer += this.next();
            }

            return buffer;
        }
    }

    return {
        TokenType: TokenType,
        Token: Token,
        Lexer: Lexer
    };
});
