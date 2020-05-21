import { Parsed, isExp, isProgram, isDefineExp, Program, Exp, isCExp,isNumExp, isProcExp, isPrimOp,
         isStrExp, isIfExp, isLetExp, isLitExp, isAppExp, isLetrecExp, isSetExp, isBinding, isAtomicExp,
         isCompoundExp, AtomicExp, CompoundExp, isBoolExp, isVarRef, AppExp, makePrimOp, CExp, IfExp, ProcExp, LetExp, LitExp, LetrecExp, SetExp } from "./L4-ast";
import { Result, makeFailure, makeOk, isOk } from "../shared/result";
import { Graph, makeGraph, makeCompoundGraph, CompoundGraph, makeEdge, makeNodeDecl, Node, makeEdgeLabel, Edge, isNodeDecl, isNode, makeTD, graphContent, AtomicGraph, makeAtomicGraph } from "./Mermaid-ast";
import { map } from "ramda";

const nullNode :Node = makeNodeDecl("Null","Null");

export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>
    isExp(exp)? mapL4ExptoMermaid(exp) :
    isProgram(exp)? mapL4ProgramtoMermaid(exp) : 
    makeFailure("no good\n");

    


export const mapL4ExptoMermaid = (exp: Exp): Result<Graph> =>
   // isDefineExp(exp) ? mapL4ExptoMermaid(exp.val): 
    isCExp(exp) ?
        isAtomicExp(exp) ? makeOk(makeGraph(makeTD(), mapAtomicExp(exp))):
        isCompoundExp(exp) ? makeOk(makeGraph(makeTD(),mapCompExp(exp))) : 
        makeFailure("Unrecognized CExp")
    :
    makeFailure("Unrecognized Exp"); 



export const mapAtomicExp = (exp: AtomicExp): AtomicGraph =>
//AtomicExp = NumExp | BoolExp | StrExp | PrimOp | VarRef
    isNumExp(exp)? makeAtomicGraph(makeNodeDecl(makeVarGen()("NumExp"),"NumExp("+exp.val+")")) : 
    isBoolExp(exp)? makeAtomicGraph(makeNodeDecl(makeVarGen()("BoolExp"),"BoolExp("+exp.val+")")) :
    isStrExp(exp)? makeAtomicGraph(makeNodeDecl(makeVarGen()("StrExp"),"StrExp("+exp.val+")")):
    isPrimOp(exp)? makeAtomicGraph(makeNodeDecl(makeVarGen()("PrimOp"),"PrimOp("+exp.op+")")):
    isVarRef(exp)? makeAtomicGraph(makeNodeDecl(makeVarGen()("VarRef"),"VarRef("+exp.var+")")):
    makeAtomicGraph(nullNode);

export const mapCompExp = (exp: CompoundExp): CompoundGraph =>
//CompoundExp = AppExp | IfExp | ProcExp | LetExp | LitExp | LetrecExp | SetExp;
    isAppExp(exp)? makeCompoundGraph(mapL4AppToMermaid(exp)):
    isIfExp(exp)?  makeCompoundGraph(mapL4IfToMermaid(exp)) : 
    isProcExp(exp)?  makeCompoundGraph(mapL4ProcToMermaid(exp)): 
    isLetExp(exp)?  makeCompoundGraph(mapL4LetToMermaid(exp)): 
    isLitExp(exp)?  makeCompoundGraph(mapL4LitToMermaid(exp)): 
    isLetrecExp(exp)? makeCompoundGraph(mapL4LetrecToMermaid(exp)): 
    isSetExp(exp)?  makeCompoundGraph(mapL4SetToMermaid(exp)) : 
    makeCompoundGraph([makeEdge(nullNode,nullNode)]);

export const mapL4AppToMermaid = (exp: AppExp): Edge[] =>{
    
    //Head node
    const appExpNode :Node = makeNodeDecl(makeVarGen()("AppExp"),"AppExp")

    //Rator node handle
    let ratorStr :string;
    isPrimOp(exp.rator) ? ratorStr = exp.rator.op : ratorStr = "";
    const ratorNode :Node = makeNodeDecl(makeVarGen()("PrimOp"),"PrimOp("+ratorStr+")")
    const ratorEdge :Edge[] = [makeEdge(appExpNode, ratorNode, makeEdgeLabel("rator"))]
    //Rand nodes
    const randsPointerNode = makeNodeDecl(makeVarGen()("Rands"),":")
    const randsPtrEdge :Edge[] = [makeEdge(appExpNode, randsPointerNode, makeEdgeLabel("rands"))]

    const randsNodes: Node[] = exp.rands.map(x => makeCexpNode(x))
    const randsEdges: Edge[] = map(x => makeEdge(randsPointerNode,x) ,randsNodes) 

    const edges = ratorEdge.concat(randsPtrEdge, randsEdges)
    return edges;
}

const mapL4IfToMermaid = (exp:IfExp): Edge[] => {
        //test: CExp; then: CExp; alt: CExp;

        const ifExpNode :Node = makeNodeDecl(makeVarGen()("IfExp"),"IfExp")
        const testNode :Node = makeCexpNode(exp.test)
        const thenNode :Node = makeCexpNode(exp.then)
        const altNode :Node = makeCexpNode(exp.alt)
        const edges = [makeEdge(ifExpNode,testNode,makeEdgeLabel("test")),
                       makeEdge(ifExpNode,thenNode,makeEdgeLabel("then")),
                       makeEdge(ifExpNode,altNode, makeEdgeLabel("alt"))];
        return edges;
}
    

const mapL4ProcToMermaid = (exp:ProcExp): Edge[] => 
    [makeEdge(nullNode, nullNode)]

const mapL4LetToMermaid = (exp:LetExp): Edge[] => 
    [makeEdge(nullNode, nullNode)]

const mapL4LitToMermaid = (exp:LitExp): Edge[] => 
    [makeEdge(nullNode, nullNode)]

const mapL4LetrecToMermaid = (exp: LetrecExp): Edge[] => 
    [makeEdge(nullNode, nullNode)]

const mapL4SetToMermaid = (exp: SetExp): Edge[] => 
    [makeEdge(nullNode, nullNode)];

export const makeCexpNode = (exp: CExp): Node =>
    /*
    AtomicExp = NumExp | BoolExp | StrExp | PrimOp | VarRef;
    CompoundExp = AppExp | IfExp | ProcExp | LetExp | LitExp | LetrecExp | SetExp;
    */
    isAtomicExp(exp)? mapAtomicExp(exp).node :
    isCompoundExp(exp)? mapCompExp(exp).edges[0].from:
    nullNode;



export const mapL4ProgramtoMermaid = (exp: Program): Graph =>{}
    
    
export const makeVarGen = (): (v: string) => string => {
    let count: number = 0;
    return (v: string) => {
        count++;
        return `${v}__${count}`;
    };
};
        /*
        
        isProcExp(exp)? :
        isLetExp(exp)? :
        isLitExp(exp)? :
       
        isLetrecExp(exp)? :
        isSetExp(exp)? :
        isBinding(exp)? :
        isPrimOp(exp)? :
        */