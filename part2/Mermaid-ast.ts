// ===========================================================
// AST type models
import { map, zipWith } from "ramda";
import { Sexp, Token } from "s-expression";
import { allT, first, second, rest, isEmpty } from "../shared/list";
import { isArray, isString, isNumericString, isIdentifier } from "../shared/type-predicates";
import { parse as p, isSexpString, isToken } from "../shared/parser";
import { Result, makeOk, makeFailure, bind, mapResult, safe2, isOk, isFailure } from "../shared/result";
import { isSymbolSExp, isEmptySExp, isCompoundSExp } from './L4-value';
import { makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp, valueToString } from './L4-value'
import { mapL4toMermaid} from './Mermaid'
import { parseL4, Program } from "./L4-ast";

// <graph> ::= <header> <graphContent> // Graph(dir: Dir, content: GraphContent)
// <header> ::= graph (TD|LR)<newline> // Direction can be TD or LR
// <graphContent> ::= <atomicGraph> | <compoundGraph>
// <atomicGraph> ::= <nodeDecl>
// <compoundGraph> ::= <edge>+
// <edge> ::= <node> --><edgeLabel>? <node><newline> // <edgeLabel> is optional
// // Edge(from: Node, to: Node, label?: string)
// <node> ::= <nodeDecl> | <nodeRef>
// <nodeDecl> ::= <identifier>["<string>"] // NodeDecl(id: string, label: string)
// <nodeRef> ::= <identifier> // NodeRef(id: string)
// <edgeLabel> ::= |<identifier>| // string

// A value returned by parse
//export type Parsed = Graph;
export type graphContent = AtomicGraph | CompoundGraph;
export type Node = NodeDecl | NodeRef;
export type Dir = TD | LR;

export interface TD {tag:"TD"};
export interface LR {tag:"LR"};
export interface Graph {tag:"Graph"; dir: Dir, graphContent: graphContent}
//Header needed????
//export interface Header {tag: "Header"; graph: Graph; edges: Edge[]}
export interface AtomicGraph {tag: "AtomicGraph"; node: NodeDecl; }
export interface CompoundGraph {tag: "CompoundGraph"; edges: Edge[];}
export interface Edge {tag: "Edge"; from: Node, to: Node, label?: EdgeLabel;}
export interface NodeDecl {tag:"NodeDecl"; id: string; label: string;}
export interface NodeRef {tag:"NodeRef"; id: string;}
export interface EdgeLabel {tag: "EdgeLabel"; label: string;}


// Type value constructors for disjoint types
export const makeTD = (): TD => ({tag: "TD"});
export const makeLR = (): LR => ({tag: "LR"});
export const makeGraph = (dir: Dir, graphContent: graphContent): Graph =>
    ({tag: "Graph", dir: dir, graphContent: graphContent});
export const makeAtomicGraph = (node: NodeDecl): AtomicGraph => 
    ({tag: "AtomicGraph", node: node});
export const makeCompoundGraph = (edges: Edge[]): CompoundGraph =>
    ({tag: "CompoundGraph", edges: edges});
export const makeEdge = (from: Node, to: Node, label?: EdgeLabel): Edge =>
    ({tag: "Edge", from: from, to: to, label: label});
export const makeNodeDecl = (id: string, label: string): NodeDecl =>
    ({tag: "NodeDecl", id: id, label: label});
export const makeNodeRef = (id: string): NodeRef =>
    ({tag: "NodeRef", id: id});
export const makeEdgeLabel = (label:string): EdgeLabel =>
    ({tag:"EdgeLabel", label: label});

// Type predicates for disjoint and union types
export const isTD = (x: any): x is TD => x.tag === "TD";
export const isLR = (x: any): x is LR => x.tag === "LR";
export const isGraph = (x: any): x is Graph => x.tag === "Graph";
export const isAtomicGraph = (x: any): x is AtomicGraph => x.tag === "AtomicGraph";
export const isCompoundGraph = (x: any): x is CompoundGraph => x.tag === "CompoundGraph";
export const isEdge = (x: any): x is Edge => x.tag === "Edge";
export const isNodeDecl = (x: any): x is NodeDecl =>
    x.tag === "NodeDecl";
export const isNodeRef = (x: any): x is NodeRef =>
    x.tag === "NodeRef";
export const isEdgeLabel = (x: any): x is EdgeLabel =>
    x.tag === "EdgeLabel";
export const isGraphContent = (x: any): x is graphContent =>
    isAtomicGraph(x) || isCompoundGraph(x);
export const isNode = (x: any): x is Node =>
    isNodeDecl(x) || isNodeRef(x);
export const isDir = (x: any): x is Dir =>
    isLR(x) || isTD(x);   

// ========================================================
// Unnparsing
export const unparseMermaid = (exp: Graph): Result<string> => 
    isGraph(exp) ? makeOk('Graph  ' + dirToString(exp.dir) + GContentToString(exp.graphContent)):
    makeFailure("Failed to unparse graph\n");



export const dirToString = (dir: Dir): string =>
    isTD(dir) ? "TD\n" :
    isLR(dir) ? "LR\n" :
    "";


export const GContentToString = (exp: graphContent): string =>
    isAtomicGraph(exp) ? "AtomicGraph_"+exp.node.id+'['+exp.node.label+']': 
    isCompoundGraph(exp) ? map(edgeToString, exp.edges).join(" ") :
    ""; 


export const edgeToString = (edge:Edge): string =>
    isEdge(edge) ? "nodeDecl" + "_" + edge.from.id +" --> "+"|"+edge.label+"| "+ nodeToString(edge.to)+"\n":
    "";


export const nodeToString = (node: Node): string =>
    isNodeDecl(node) ? "nodeDecl" + "_" + node.id + "[" + node.label + "]":
    isNodeRef(node) ? node.id:
    "";
//TODO: is parseL4 the right function???

export const L4toMermaid = (concrete: string): Result<string> => {
    let parsedL4Res :Result<Program> = parseL4(concrete);
    
    if (isOk(parsedL4Res)){
        console.log("parsedL4 ok\n")
        let mermaid : Result <Graph> = mapL4toMermaid(parsedL4Res.value)
        if(isOk(mermaid)){
            console.log("mermaid ok\n")
            return unparseMermaid(mermaid.value)
        }
    }
        return makeFailure("Failed to parse");
    
}
// TODO: Delete no needed imports

const str :string ="(L4 (+ 3 4))"
//let stinkynode :Node = makeNodeDecl("Id try","Label try")
//console.log("stinkynode:\n"+stinkynode.id+"\n"+stinkynode.label+"\n"+"tag - "+ stinkynode.tag+"\n")
console.log(L4toMermaid(str));



















// ========================================================
// Parsing(from L4)


/*
export const parseL4 = (x: string): Result<Program> =>
    bind(p(x), parseL4Program);

export const parseL4Program = (sexp: Sexp): Result<Program> =>
    sexp === "" || isEmpty(sexp) ? makeFailure("Unexpected empty program") :
    isToken(sexp) ? makeFailure("Program cannot be a single token") :
    isArray(sexp) ? parseL4GoodProgram(first(sexp), rest(sexp)) :
    makeFailure("Unexpected type " + sexp);

const parseL4GoodProgram = (keyword: Sexp, body: Sexp[]): Result<Program> =>
    keyword === "L4" && !isEmpty(body) ? bind(mapResult(parseL4Exp, body),
                                              (exps: Exp[]) => makeOk(makeProgram(exps))) :
    makeFailure("Program must be of the form (L4 <exp>+)");

export const parseL4Exp = (sexp: Sexp): Result<Exp> =>
    isEmpty(sexp) ? makeFailure("Exp cannot be an empty list") :
    isArray(sexp) ? parseL4CompoundExp(first(sexp), rest(sexp)) :
    isToken(sexp) ? parseL4Atomic(sexp) :
    makeFailure("Unexpected type " + sexp);

export const parseL4CompoundExp = (op: Sexp, params: Sexp[]): Result<Exp> => 
    op === "define" ? parseDefine(params) :
    parseL4CompoundCExp(op, params);

export const parseL4CompoundCExp = (op: Sexp, params: Sexp[]): Result<CExp> =>
    isString(op) && isSpecialForm(op) ? parseL4SpecialForm(op, params) :
    parseAppExp(op, params);

export const parseL4SpecialForm = (op: Sexp, params: Sexp[]): Result<CExp> =>
    isEmpty(params) ? makeFailure("Empty args for special form") :
    op === "if" ? parseIfExp(params) :
    op === "lambda" ? parseProcExp(first(params), rest(params)) :
    op === "let" ? parseLetExp(first(params), rest(params)) :
    op === "quote" ? parseLitExp(first(params)) :
    op === "letrec" ? parseLetrecExp(first(params), rest(params)) :
    op === "set!" ? parseSetExp(params) :
    makeFailure("Never");

export const parseDefine = (params: Sexp[]): Result<DefineExp> =>
    isEmpty(params) ? makeFailure("define missing 2 arguments") :
    isEmpty(rest(params)) ? makeFailure("define missing 1 arguments") :
    ! isEmpty(rest(rest(params))) ? makeFailure("define has too many arguments") :
    parseGoodDefine(first(params), second(params));

const parseGoodDefine = (variable: Sexp, val: Sexp): Result<DefineExp> =>
    ! isIdentifier(variable) ? makeFailure("First arg of define must be an identifier") :
    bind(parseL4CExp(val),
         (value: CExp) => makeOk(makeDefineExp(makeVarDecl(variable), value)));

export const parseL4Atomic = (token: Token): Result<CExp> =>
    token === "#t" ? makeOk(makeBoolExp(true)) :
    token === "#f" ? makeOk(makeBoolExp(false)) :
    isString(token) && isNumericString(token) ? makeOk(makeNumExp(+token)) :
    isString(token) && isPrimitiveOp(token) ? makeOk(makePrimOp(token)) :
    isString(token) ? makeOk(makeVarRef(token)) :
    makeOk(makeStrExp(token.toString()));

export const parseL4CExp = (sexp: Sexp): Result<CExp> =>
    isEmpty(sexp) ? makeFailure("CExp cannot be an empty list") :
    isArray(sexp) ? parseL4CompoundCExp(first(sexp), rest(sexp)) :
    isToken(sexp) ? parseL4Atomic(sexp) :
    makeFailure("Unexpected type " + sexp);

/*
    ;; <prim-op>  ::= + | - | * | / | < | > | = | not | and | or | eq? | string=?
    ;;                  | cons | car | cdr | pair? | number? | list
    ;;                  | boolean? | symbol? | string?      ##### L3
*/
/*
const isPrimitiveOp = (x: string): boolean =>
    ["+", "-", "*", "/", ">", "<", "=", "not", "and", "or", 
     "eq?", "string=?", "cons", "car", "cdr", "list", "pair?",
     "list?", "number?", "boolean?", "symbol?", "string?"].includes(x);

const isSpecialForm = (x: string): boolean =>
    ["if", "lambda", "let", "quote", "letrec", "set!"].includes(x);

const parseAppExp = (op: Sexp, params: Sexp[]): Result<AppExp> =>
    safe2((rator: CExp, rands: CExp[]) => makeOk(makeAppExp(rator, rands)))
        (parseL4CExp(op), mapResult(parseL4CExp, params));

const parseIfExp = (params: Sexp[]): Result<IfExp> =>
    params.length !== 3 ? makeFailure("Expression not of the form (if <cexp> <cexp> <cexp>)") :
    bind(mapResult(parseL4CExp, params),
         (cexps: CExp[]) => makeOk(makeIfExp(cexps[0], cexps[1], cexps[2])));

const parseProcExp = (vars: Sexp, body: Sexp[]): Result<ProcExp> =>
    isArray(vars) && allT(isString, vars) ? bind(mapResult(parseL4CExp, body),
                                                 (cexps: CExp[]) => makeOk(makeProcExp(map(makeVarDecl, vars), cexps))) :
    makeFailure(`Invalid vars for ProcExp`);

const isGoodBindings = (bindings: Sexp): bindings is [string, Sexp][] =>
    isArray(bindings) &&
    allT(isArray, bindings) &&
    allT(isIdentifier, map(first, bindings));

const parseBindings = (bindings: Sexp): Result<Binding[]> => {
    if (!isGoodBindings(bindings)) {
        return makeFailure(`Invalid bindings: ${bindings}`);
    }
    const vars = map(b => b[0], bindings);
    const valsResult = mapResult(binding => parseL4CExp(second(binding)), bindings);
    return bind(valsResult,
                (vals: CExp[]) => makeOk(zipWith(makeBinding, vars, vals)));
}

const parseLetExp = (bindings: Sexp, body: Sexp[]): Result<LetExp> =>
    safe2((bindings: Binding[], body: CExp[]) => makeOk(makeLetExp(bindings, body)))
        (parseBindings(bindings), mapResult(parseL4CExp, body));

const parseLetrecExp = (bindings: Sexp, body: Sexp[]): Result<LetrecExp> =>
    safe2((bindings: Binding[], body: CExp[]) => makeOk(makeLetrecExp(bindings, body)))
        (parseBindings(bindings), mapResult(parseL4CExp, body));

const parseSetExp = (params: Sexp[]): Result<SetExp> =>
    isEmpty(params) ? makeFailure("set! missing 2 arguments") :
    isEmpty(rest(params)) ? makeFailure("set! missing 1 argument") :
    ! isEmpty(rest(rest(params))) ? makeFailure("set! has too many arguments") :
    parseGoodSetExp(first(params), second(params));

const parseGoodSetExp = (variable: Sexp, val: Sexp): Result<SetExp> =>
    ! isIdentifier(variable) ? makeFailure("First arg of set! must be an identifier") :
    bind(parseL4CExp(val), (val: CExp) => makeOk(makeSetExp(makeVarRef(variable), val)));

// LitExp has the shape (quote <sexp>)
export const parseLitExp = (param: Sexp): Result<LitExp> =>
    bind(parseSExp(param), (sexp: SExpValue) => makeOk(makeLitExp(sexp)));

export const isDottedPair = (sexps: Sexp[]): boolean =>
    sexps.length === 3 && 
    sexps[1] === "."

export const makeDottedPair = (sexps : Sexp[]): Result<SExpValue> =>
    safe2((val1: SExpValue, val2: SExpValue) => makeOk(makeCompoundSExp(val1, val2)))
        (parseSExp(sexps[0]), parseSExp(sexps[2]));

// x is the output of p (sexp parser)
export const parseSExp = (sexp: Sexp): Result<SExpValue> =>
    sexp === "#t" ? makeOk(true) :
    sexp === "#f" ? makeOk(false) :
    isString(sexp) && isNumericString(sexp) ? makeOk(+sexp) :
    isSexpString(sexp) ? makeOk(sexp.toString()) :
    isString(sexp) ? makeOk(makeSymbolSExp(sexp)) :
    sexp.length === 0 ? makeOk(makeEmptySExp()) :
    isDottedPair(sexp) ? makeDottedPair(sexp) :
    isArray(sexp) ? (
        // fail on (x . y z)
        sexp[0] === '.' ? makeFailure("Bad dotted sexp: " + sexp) : 
        safe2((val1: SExpValue, val2: SExpValue) => makeOk(makeCompoundSExp(val1, val2)))
            (parseSExp(first(sexp)), parseSExp(rest(sexp)))) :
    makeFailure(`Bad literal expression: ${sexp}`);


// ==========================================================================
// Unparse: Map an AST to a concrete syntax string.

// Add a quote for symbols, empty and compound sexp - strings and numbers are not quoted.
const unparseLitExp = (le: LitExp): string =>
    isEmptySExp(le.val) ? `'()` :
    isSymbolSExp(le.val) ? `'${valueToString(le.val)}` :
    isCompoundSExp(le.val) ? `'${valueToString(le.val)}` :
    `${le.val}`;

const unparseLExps = (les: Exp[]): string =>
    map(unparse, les).join(" ");

const unparseProcExp = (pe: ProcExp): string => 
    `(lambda (${map((p: VarDecl) => p.var, pe.args).join(" ")}) ${unparseLExps(pe.body)})`

const unparseBindings = (bdgs: Binding[]): string =>
    map((b: Binding) => `(${b.var.var} ${unparse(b.val)})`, bdgs).join(" ");

const unparseLetExp = (le: LetExp) : string => 
    `(let (${unparseBindings(le.bindings)}) ${unparseLExps(le.body)})`

const unparseLetrecExp = (le: LetrecExp): string => 
    `(letrec (${unparseBindings(le.bindings)}) ${unparseLExps(le.body)})`

const unparseSetExp = (se: SetExp): string =>
    `(set! ${se.var.var} ${unparse(se.val)})`;

export const unparse = (exp: Parsed): string =>
    isBoolExp(exp) ? valueToString(exp.val) :
    isNumExp(exp) ? valueToString(exp.val) :
    isStrExp(exp) ? valueToString(exp.val) :
    isLitExp(exp) ? unparseLitExp(exp) :
    isVarRef(exp) ? exp.var :
    isProcExp(exp) ? unparseProcExp(exp) :
    isIfExp(exp) ? `(if ${unparse(exp.test)} ${unparse(exp.then)} ${unparse(exp.alt)})` :
    isAppExp(exp) ? `(${unparse(exp.rator)} ${unparseLExps(exp.rands)})` :
    isPrimOp(exp) ? exp.op :
    isLetExp(exp) ? unparseLetExp(exp) :
    isLetrecExp(exp) ? unparseLetrecExp(exp) :
    isSetExp(exp) ? unparseSetExp(exp) :
    isDefineExp(exp) ? `(define ${exp.var.var} ${unparse(exp.val)})` :
    isProgram(exp) ? `(L4 ${unparseLExps(exp.exps)})` :
    "";
*/