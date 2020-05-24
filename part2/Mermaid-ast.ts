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
import { isUndefined } from "util";

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
    isGraph(exp) ? makeOk('graph ' + dirToString(exp.dir)+'\n ' + GContentToString(exp.graphContent)):
    makeFailure("Failed to unparse graph\n");



export const dirToString = (dir: Dir): string =>
    isTD(dir) ? "TD" :
    isLR(dir) ? "LR" :
    "";


export const GContentToString = (exp: graphContent): string =>
    isAtomicGraph(exp) ? exp.node.id+'['+exp.node.label+']': 
    isCompoundGraph(exp) ? map(edgeToString, exp.edges).join(" ") :
    ""; 


export const edgeToString = (edge:Edge): string =>
    isEdge(edge) ? edge.from.id +'["'+getNodeLabel(edge.from)+'"]'+" --> "+getEdgeLabel(edge.label)+ nodeToString(edge.to)+"\n":
    "";


export const nodeToString = (node: Node): string =>
    isNodeDecl(node) ?
        node.label===":"? node.id + "[:]":
        node.id + '["' + node.label + '"]':
    isNodeRef(node) ? node.id:
    "";

export const getEdgeLabel = (label: EdgeLabel|undefined): string =>
    isUndefined(label)? "":
    isEdgeLabel(label)? label.label===""? "": ("|"+label?.label+"| "):
    "";
export const getNodeLabel = (node: Node): string =>
    isNodeDecl(node)? node.label:
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
console.log("Test 1\n\n")
const str :string ="(L4 (lambda (x y)((lambda (x) (+ x y))(+ x x))1)) "

const mermaidL4 = L4toMermaid(str);
isOk(mermaidL4)?
    console.log(mermaidL4.value):
    console.log(mermaidL4);

console.log("\n\nTest 2\n\n")
const str2 :string ="(L4 (define my-list '(1 2)))"

const mermaidL42 = L4toMermaid(str2);
isOk(mermaidL42)?
    console.log(mermaidL42.value):
    console.log(mermaidL42);

console.log("\n\nTest 3\n\n")
const str3 :string ="(L4 (* (+ 3 4) (+ 2 3)))"
const mermaidL43 = L4toMermaid(str3);
isOk(mermaidL43)?
    console.log(mermaidL43.value):
    console.log(mermaidL43);

console.log("\n\nTest 4\n\n")
const str4 :string ="(L4 (+ 3 4))"
const mermaidL44 = L4toMermaid(str4);
isOk(mermaidL44)?
    console.log(mermaidL44.value):
    console.log(mermaidL44);

