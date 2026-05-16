/** AST for boolean expressions parsed from RS_AddRule expr commands. */
export type ExprAST =
  | { op: "IDENT"; name: string }
  | { op: "AND" | "OR" | "NOT" | "XOR"; args: ExprAST[] };

class Parser {
  private pos = 0;
  constructor(private readonly tokens: string[]) {}

  private peek(): string | undefined { return this.tokens[this.pos]; }
  private advance(): string { return this.tokens[this.pos++] ?? ""; }
  private eat(op: string): boolean {
    if (this.peek()?.toUpperCase() === op) { this.advance(); return true; }
    return false;
  }

  // expr := xorExpr (OR xorExpr)*
  parseExpr(): ExprAST {
    let node = this.parseXor();
    while (this.eat("OR")) node = { op: "OR", args: [node, this.parseXor()] };
    return node;
  }

  // xorExpr := term (XOR term)*
  private parseXor(): ExprAST {
    let node = this.parseTerm();
    while (this.eat("XOR")) node = { op: "XOR", args: [node, this.parseTerm()] };
    return node;
  }

  // term := factor (AND factor)*
  private parseTerm(): ExprAST {
    let node = this.parseFactor();
    while (this.eat("AND")) node = { op: "AND", args: [node, this.parseFactor()] };
    return node;
  }

  // factor := NOT factor | atom
  private parseFactor(): ExprAST {
    if (this.eat("NOT")) return { op: "NOT", args: [this.parseFactor()] };
    return this.parseAtom();
  }

  // atom := IDENT | '(' expr ')'
  private parseAtom(): ExprAST {
    if (this.peek() === "(") {
      this.advance();
      const inner = this.parseExpr();
      if (this.peek() === ")") this.advance();
      return inner;
    }
    return { op: "IDENT", name: this.advance() };
  }
}

/**
 * Parse a boolean expression string (space-separated tokens, keywords AND/OR/NOT/XOR,
 * parentheses allowed) into an AST. Returns null if the string is empty or unparseable.
 */
export function parseExpr(exprStr: string): ExprAST | null {
  const tokens = exprStr
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return null;

  try {
    return new Parser(tokens).parseExpr();
  } catch {
    return null;
  }
}
