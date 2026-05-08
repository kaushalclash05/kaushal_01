/**
 * ============================================================
 *  MINI-COMPILER — CLI Runner
 * ============================================================
 *  Run with:  node run.js
 *
 *  Compiles all four test cases and prints a detailed,
 *  colour-coded report to the terminal.
 * ============================================================
 */

'use strict';

const { compile } = require('./src/compiler');

// ── ANSI colour helpers ───────────────────────────────────────
const C = {
  reset  : '\x1b[0m',
  bold   : '\x1b[1m',
  dim    : '\x1b[2m',
  green  : '\x1b[32m',
  red    : '\x1b[31m',
  yellow : '\x1b[33m',
  cyan   : '\x1b[36m',
  blue   : '\x1b[34m',
  magenta: '\x1b[35m',
  white  : '\x1b[37m',
  bgBlue : '\x1b[44m',
  bgRed  : '\x1b[41m',
  bgGreen: '\x1b[42m',
};
const col  = (c, s) => `${c}${s}${C.reset}`;
const bold = (s)    => col(C.bold, s);
const ok   = (s)    => col(C.green,  '✓ ' + s);
const fail = (s)    => col(C.red,    '✗ ' + s);

// ── Test cases ────────────────────────────────────────────────
const TEST_CASES = [
  {
    name   : 'Test 1 — Simple Variable Assignment',
    source : `int x = 5;\nint y = 10;\nint z = x + y;`,
  },
  {
    name   : 'Test 2 — Arithmetic Expressions',
    source : `int a = 3;\nint b = a * 2 + 4;\nint c = b - a;`,
  },
  {
    name   : 'Test 3 — If-Else Control Flow',
    source :
`int x = 8;
if (x > 5) {
  int result = x * 2;
} else {
  int result = 0;
}`,
  },
  {
    name   : 'Test 4 — Semantic Errors (undeclared var + type mismatch)',
    source :
`int x = 5;
int y = x + z;
float w = "hello";`,
  },
];

// ── Formatting helpers ────────────────────────────────────────
function printDivider(char = '─', len = 60) {
  console.log(col(C.dim, char.repeat(len)));
}

function printHeader(name, idx) {
  console.log('\n');
  printDivider('═');
  console.log(
    col(C.bgBlue, C.bold + `  ${idx + 1}/${TEST_CASES.length}  `) +
    '  ' + bold(name)
  );
  printDivider('═');
}

function printPhaseTitle(title) {
  console.log('\n' + col(C.cyan + C.bold, `▸ ${title}`));
  printDivider();
}

function printTokens(tokens) {
  printPhaseTitle('PHASE 1 — LEXER  (Tokens)');
  const typeColor = {
    KEYWORD    : C.magenta,
    IDENTIFIER : C.blue,
    NUMBER     : C.green,
    OPERATOR   : C.yellow,
    PUNCTUATION: C.dim,
    STRING     : C.red,
    UNKNOWN    : C.red,
    EOF        : C.dim,
  };
  const cols  = 6;
  const lines = [];
  let   row   = [];

  tokens.filter(t => t.type !== 'EOF').forEach((t, i) => {
    const badge = col(typeColor[t.type] || C.white, t.type.padEnd(11));
    row.push(`  ${badge} ${col(C.bold, `'${t.value}'`)}`);
    if (row.length === cols) { lines.push(row.join('')); row = []; }
  });
  if (row.length) lines.push(row.join(''));
  lines.forEach(l => console.log(l));
  console.log(col(C.dim, `\n  Total tokens: ${tokens.filter(t => t.type !== 'EOF').length}`));
}

function printAST(node, indent = 0) {
  if (!node || typeof node !== 'object') return;
  const pad = '  '.repeat(indent);

  switch (node.node) {
    case 'Program':
      console.log(pad + col(C.cyan, 'Program'));
      node.body.forEach(n => printAST(n, indent + 1));
      break;
    case 'VarDecl':
      console.log(pad + col(C.blue,  'VarDecl') +
        col(C.dim, ' dtype=') + col(C.yellow, node.dtype) +
        col(C.dim, ' name=')  + col(C.green,  node.name));
      if (node.init) printAST(node.init, indent + 1);
      break;
    case 'Assign':
      console.log(pad + col(C.blue, 'Assign') +
        col(C.dim, ' name=') + col(C.green, node.name));
      printAST(node.value, indent + 1);
      break;
    case 'BinOp':
      console.log(pad + col(C.magenta, 'BinOp') +
        col(C.dim, ' op=') + col(C.yellow, `'${node.op}'`));
      printAST(node.left,  indent + 1);
      printAST(node.right, indent + 1);
      break;
    case 'Num':
      console.log(pad + col(C.green, `Num(${node.value})`));
      break;
    case 'Str':
      console.log(pad + col(C.red, `Str(${node.value})`));
      break;
    case 'Var':
      console.log(pad + col(C.blue, `Var(${node.name})`));
      break;
    case 'If':
      console.log(pad + col(C.cyan, 'If'));
      console.log(pad + col(C.dim, '  cond:'));  printAST(node.cond, indent + 2);
      console.log(pad + col(C.dim, '  then:'));  printAST(node.then, indent + 2);
      if (node.else) {
        console.log(pad + col(C.dim, '  else:')); printAST(node.else, indent + 2);
      }
      break;
    case 'While':
      console.log(pad + col(C.cyan, 'While'));
      console.log(pad + col(C.dim, '  cond:')); printAST(node.cond, indent + 2);
      console.log(pad + col(C.dim, '  body:')); printAST(node.body, indent + 2);
      break;
    case 'Block':
      console.log(pad + col(C.cyan, 'Block'));
      node.body.forEach(n => printAST(n, indent + 1));
      break;
    case 'Return':
      console.log(pad + col(C.cyan, 'Return'));
      printAST(node.value, indent + 1);
      break;
    default:
      console.log(pad + JSON.stringify(node));
  }
}

function printSemantic(semantic) {
  printPhaseTitle('PHASE 3 — SEMANTIC ANALYSIS');

  // Symbol table
  const entries = Object.entries(semantic.symbolTable);
  console.log(col(C.bold, '  Symbol Table:'));
  if (entries.length === 0) {
    console.log(col(C.dim, '  (empty)'));
  } else {
    console.log(col(C.dim, '  ' + 'Name'.padEnd(16) + 'Type'));
    entries.forEach(([name, info]) =>
      console.log(`  ${col(C.green, name.padEnd(16))}${col(C.yellow, info.dtype)}`));
  }

  // Messages
  console.log('\n' + col(C.bold, '  Analysis Messages:'));
  semantic.messages.forEach(m =>
    console.log('  ' + (m.ok ? ok(m.text) : fail(m.text))));
}

function printCodeGen(codegen) {
  printPhaseTitle('PHASE 4 — CODE GENERATION  (Three-Address Code)');
  const lines = codegen.listing.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.endsWith(':')) {
      // label
      console.log(col(C.yellow, line));
    } else if (trimmed.startsWith('IF_FALSE')) {
      console.log(col(C.magenta, line));
    } else if (trimmed.startsWith('GOTO')) {
      console.log(col(C.cyan, line));
    } else if (trimmed.startsWith('RETURN')) {
      console.log(col(C.green, line));
    } else {
      console.log(line);
    }
  });
}

// ── Main loop ─────────────────────────────────────────────────
TEST_CASES.forEach((tc, idx) => {
  printHeader(tc.name, idx);

  // Source
  console.log('\n' + col(C.bold, 'Source Code:'));
  tc.source.split('\n').forEach((l, i) =>
    console.log(col(C.dim, `  ${String(i + 1).padStart(2)}  `) + l));

  const result = compile(tc.source);

  // ── Phase 1 ────────────────────────────────────────────────
  if (result.lexError) {
    printPhaseTitle('PHASE 1 — LEXER');
    console.log(fail('Lex error: ' + result.lexError));
    return;
  }
  printTokens(result.tokens);

  // ── Phase 2 ────────────────────────────────────────────────
  printPhaseTitle('PHASE 2 — PARSER  (AST)');
  if (result.parseError) {
    console.log(fail('Parse error: ' + result.parseError));
    return;
  }
  printAST(result.ast);

  // ── Phase 3 ────────────────────────────────────────────────
  if (result.semantic) printSemantic(result.semantic);

  // ── Phase 4 ────────────────────────────────────────────────
  if (result.codegen) {
    printCodeGen(result.codegen);
  }

  // ── Summary ────────────────────────────────────────────────
  console.log('\n');
  if (result.success) {
    console.log(col(C.bgGreen + C.bold, '  COMPILE SUCCESS  '));
  } else {
    console.log(col(C.bgRed + C.bold,   '  COMPILE FAILED   '));
    if (result.semantic?.errors.length) {
      result.semantic.errors.forEach(e => console.log('  ' + fail(e.text)));
    }
  }
});

console.log('\n');
printDivider('═');
console.log(bold('All test cases complete.'));
printDivider('═');
console.log('');