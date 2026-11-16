/**
 * Panfam-Terminal POSIX Parser & AST Generator
 * Transforms token streams into executable command AST nodes:
 * PipelineNode, BinaryOpNode (&&, ||, ;), CommandNode, RedirectionNode.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const LexerModule = require('./lexer');
        module.exports = factory(LexerModule);
    } else {
        root.TerminalParser = factory(root.TerminalLexer);
    }
})(typeof self !== 'undefined' ? self : this, function (LexerModule) {
    'use strict';

    const { TokenType, Lexer } = LexerModule;

    class CommandNode {
        constructor(args = [], redirections = []) {
            this.type = 'Command';
            this.args = args; // string tokens
            this.redirections = redirections; // array of { type: '>', '>>', '<', '2>', '2>&1', target: string }
        }
    }

    class PipelineNode {
        constructor(commands = []) {
            this.type = 'Pipeline';
            this.commands = commands; // Array of CommandNode
        }
    }

    class BinaryOpNode {
        constructor(op, left, right) {
            this.type = 'BinaryOp';
            this.op = op; // '&&', '||', ';'
            this.left = left;
            this.right = right;
        }
    }

    class Parser {
        constructor(tokens) {
            this.tokens = tokens || [];
            this.index = 0;
        }

        peek() {
            return this.index < this.tokens.length ? this.tokens[this.index] : null;
        }

        next() {
            return this.index < this.tokens.length ? this.tokens[this.index++] : null;
        }

        match(tokenType) {
            const token = this.peek();
            if (token && token.type === tokenType) {
                return this.next();
            }
            return null;
        }

        parse() {
            if (this.tokens.length === 0 || this.peek().type === TokenType.EOF) {
                return null;
            }
            return this.parseSequence();
        }

        // Handles sequences separated by ';'
        parseSequence() {
            let left = this.parseLogical();

            while (this.match(TokenType.SEMICOLON)) {
                if (!this.peek() || this.peek().type === TokenType.EOF) {
                    break;
                }
                const right = this.parseLogical();
                if (right) {
                    left = new BinaryOpNode(';', left, right);
                }
            }

            return left;
        }

        // Handles && and ||
        parseLogical() {
            let left = this.parsePipeline();

            while (true) {
                if (this.match(TokenType.AND_IF)) {
                    const right = this.parsePipeline();
                    left = new BinaryOpNode('&&', left, right);
                } else if (this.match(TokenType.OR_IF)) {
                    const right = this.parsePipeline();
                    left = new BinaryOpNode('||', left, right);
                } else {
                    break;
                }
            }

            return left;
        }

        // Handles pipelines (|)
        parsePipeline() {
            const commands = [this.parseCommand()];

            while (this.match(TokenType.PIPE)) {
                commands.push(this.parseCommand());
            }

            return commands.length === 1 ? commands[0] : new PipelineNode(commands);
        }

        // Handles single command with arguments and redirections
        parseCommand() {
            const args = [];
            const redirections = [];

            while (this.index < this.tokens.length) {
                const token = this.peek();
                if (!token || token.type === TokenType.EOF) break;

                // Stop at pipeline or logical operators
                if (token.type === TokenType.PIPE ||
                    token.type === TokenType.AND_IF ||
                    token.type === TokenType.OR_IF ||
                    token.type === TokenType.SEMICOLON) {
                    break;
                }

                // Check redirection tokens
                if (token.type === TokenType.REDIR_OUT ||
                    token.type === TokenType.REDIR_APPEND ||
                    token.type === TokenType.REDIR_IN ||
                    token.type === TokenType.REDIR_ERR) {
                    this.next(); // consume redir operator
                    const targetToken = this.match(TokenType.WORD);
                    const target = targetToken ? targetToken.value : '';
                    redirections.push({
                        type: token.value,
                        target: target
                    });
                    continue;
                }

                if (token.type === TokenType.REDIR_ERR_MERGE) {
                    this.next();
                    redirections.push({
                        type: '2>&1',
                        target: '&1'
                    });
                    continue;
                }

                if (token.type === TokenType.WORD) {
                    args.push(this.next().value);
                    continue;
                }

                // If unrecognized token, consume to avoid infinite loop
                this.next();
            }

            return new CommandNode(args, redirections);
        }
    }

    function parseInput(inputString) {
        const lexer = new Lexer(inputString);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        return parser.parse();
    }

    return {
        CommandNode: CommandNode,
        PipelineNode: PipelineNode,
        BinaryOpNode: BinaryOpNode,
        Parser: Parser,
        parseInput: parseInput
    };
});
