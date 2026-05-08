# Mini-Compiler — Full Phase Integration

A complete four-phase compiler written in plain Node.js (no dependencies).

## Project Structure

```
mini-compiler/
├── src/
│   ├── lexer.js       Phase 1 — Tokenizer
│   ├── parser.js      Phase 2 — Recursive Descent Parser (builds AST)
│   ├── semantic.js    Phase 3 — Type checker & symbol table
│   └── codegen.js     Phase 4 — Three-Address Code generator
├── compiler.js        Wires all four phases together
├── run.js             CLI runner — executes all 4 test cases
├── VIDEO_SCRIPT.txt   Step-by-step video presentation guide
└── package.json
```

## How to Run

```bash
node run.js
```

Requires Node.js v14 or later. No npm install needed.

## The Four Phases

| Phase | File | Input | Output |
|-------|------|-------|--------|
| 1. Lexer | `src/lexer.js` | Source string | Token array |
| 2. Parser | `src/parser.js` | Token array | AST |
| 3. Semantic | `src/semantic.js` | AST | Symbol table + error list |
| 4. Code Gen | `src/codegen.js` | AST | Three-address instructions |

## Test Cases

| # | Name | Tests |
|---|------|-------|
| 1 | Simple Assignment | Lexing, parsing, basic declarations |
| 2 | Arithmetic Expressions | Operator precedence (* before +) |
| 3 | If-Else Control Flow | Labels, conditional jumps in code gen |
| 4 | Semantic Errors | Undeclared variable, type mismatch |

## Language Features Supported

- Types: `int`, `float`, `void`
- Variable declarations with optional initializer
- Arithmetic: `+`, `-`, `*`, `/`
- Comparisons: `<`, `>`, `==`, `!=`, `<=`, `>=`
- Control flow: `if / else`, `while`
- `return` statements
- String literals
- Single-line comments (`//`)
