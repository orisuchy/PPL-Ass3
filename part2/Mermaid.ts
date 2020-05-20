import { Parsed, isExp, isProgram, isDefineExp, Program, Exp, isCExp,isNumExp, isProcExp, isPrimOp,
         isStrExp, isIfExp, isLetExp, isLitExp, isAppExp, isLetrecExp, isSetExp, isBinding, isAtomicExp,
         isCompoundExp, AtomicExp, CompoundExp, isBoolExp, isVarRef, AppExp, makePrimOp } from "./L4-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { Graph, makeGraph, makeCompoundGraph, CompoundGraph, makeEdge, makeNodeDecl, Node, makeEdgeLabel, Edge } from "./Mermaid-ast";

export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>
    isExp(exp)? mapL4ExptoMermaid(exp) :
    isProgram(exp)? mapL4ProgramtoMermaid(exp) : 
    makeFailure("no good\n");

    


export const mapL4ExptoMermaid = (exp: Exp): Result<Graph> =>
    isDefineExp(exp) ? mapL4ExptoMermaid(exp.val): 
    isCExp(exp) ?
        isAtomicExp(exp) ? mapAtomicExp(exp):
        isCompoundExp(exp) ? mapCompExp(exp) : 
        makeFailure("Unrecognized CExp")
    :
    makeFailure("Unrecognized Exp"); 



export const mapAtomicExp = (exp: AtomicExp): Result<Node> =>
//AtomicExp = NumExp | BoolExp | StrExp | PrimOp | VarRef
        isNumExp(exp)?  : //make mermaid node
        isBoolExp(exp)? :
        isStrExp(exp)? :
        isPrimOp(exp)? :
        isVarRef(exp)? :
        makeFailure("Failed to create atomicExp");

export const mapCompExp = (exp: CompoundExp): Result<Graph> =>
//CompoundExp = AppExp | IfExp | ProcExp | LetExp | LitExp | LetrecExp | SetExp;
    isAppExp(exp)? mapL4AppToMermaid(exp):
    isIfExp(exp)? mapL4IfToMermaid(exp) : 
    isProcExp(exp)? mapL4ProcToMermaid(exp): 
    isLetExp(exp)? mapL4LetToMermaid(exp): 
    isLitExp(exp)? mapL4LitToMermaid(exp): 
    isLetrecExp(exp)? mapL4LetrecToMermaid(exp): 
    isSetExp(exp)? mapL4SetAppToMermaid(exp) : 
    makeFailure("Failed to create CExp");

export const mapL4AppToMermaid(exp: AppExp): Result<CompoundGraph> =>{
    
    //Head node
    const appExpNode :Node = makeNodeDecl(makeVarGen()("AppExp"),"AppExp")

    //Rator node handle
    let ratorStr :string;
    isPrimOp(exp.rator) ? ratorStr = exp.rator.op : ratorStr = "";
    const ratorNode :Node = makeNodeDecl(makeVarGen()("PrimOp"),"PrimOp("+ratorStr+")")
    const ratorEdge :Edge = makeEdge(appExpNode, ratorNode, makeEdgeLabel("rator"))
    const randsPointerNode = makeNodeDecl(makeVarGen()("Rands"),":")
    // for exp = (+ x 4) 
    let xStr :string;
    isVarRef(exp.rands[0])? xStr = exp.rands[0].var : xStr = ""
    const xNode = makeNodeDecl(makeVarGen()("VarRef"),'(' + xStr + ')')
    //TODO - make fucking map
    //const randsNodes: Node[] = map(makeNodeDecl(),exp.rands)

    const randEdge = makeEdge() 
    //const randsPointerEdges = map(makeEdge(randsPointerEdges,exp.rands),exp.rands) 
    
     
    const edges = [ratorEdge,randEdge]
    return makeOk(makeCompoundGraph(edges));
}
export const mapL4ProgramtoMermaid = (exp: Program): Result<Graph> =>{}
    
    
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