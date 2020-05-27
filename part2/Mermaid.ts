import { Parsed, isExp, isProgram, isDefineExp, Program, Exp, isCExp,isNumExp, isProcExp, isPrimOp,
         isStrExp, isIfExp, isLetExp, isLitExp, isAppExp, isLetrecExp, isSetExp, isBinding, isAtomicExp,
         isCompoundExp, AtomicExp, CompoundExp, isBoolExp, isVarRef, AppExp, makePrimOp, CExp, IfExp, ProcExp, LetExp, LitExp, LetrecExp, SetExp, Binding, DefineExp } from "./L4-ast";
import { Result, makeFailure, makeOk, isOk } from "../shared/result";
import { Graph, makeGraph, makeCompoundGraph, CompoundGraph, makeEdge, makeNodeDecl, Node, makeEdgeLabel, Edge, isNodeDecl, isNode, makeTD, graphContent, AtomicGraph, makeAtomicGraph, isAtomicGraph, isCompoundGraph, isEdge, NodeRef } from "./Mermaid-ast";
import { map, concat } from "ramda";
import { SExpValue, isClosure, isSymbolSExp, isEmptySExp, isCompoundSExp, CompoundSExp } from "./L4-value";
import { isNumber, isBoolean, isString, isUndefined } from "util";


export const makeVarGen = (): (v: string) => string => {
    let count: number = 0;
    return (v: string) => {
        count++;
        return `${v}__${count}`;
    };
};
const varGenNum = makeVarGen();
const varGenBool = makeVarGen();
const varGenStr = makeVarGen();
const varGenPrimOp = makeVarGen();
const varGenRands = makeVarGen();
const varGenIf = makeVarGen();
const varGenProc = makeVarGen();
const varGenParams = makeVarGen();
const varGenBody = makeVarGen();
const varGenVardecl = makeVarGen();
const varGenLet = makeVarGen();
const varGenLetrec = makeVarGen();
const varGenLit = makeVarGen();
const varGenBindings = makeVarGen();
const varGenEmpySExp = makeVarGen();
const varGenSymbolSExp = makeVarGen();
const varGenCompoundSExp = makeVarGen();
const varGenSetExp = makeVarGen();
const varGenProgram = makeVarGen();
const varGenDefine = makeVarGen();

export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>
    isExp(exp)? mapL4ExptoMermaid(exp) :
    isProgram(exp)? mapL4ProgramtoMermaid(exp) : 
    makeFailure("Graph no good\n");

    
export const mapL4ExptoMermaid = (exp: Exp): Result<Graph> =>{
   if(isDefineExp(exp))
        return mapL4DefExptoMermaid(exp)
   else if(isCExp(exp)){
    if(isAtomicExp(exp)){
        return makeOk(makeGraph(makeTD(),makeAtomicGraph(mapAtomicExp(exp).node)));
    }
    if(isCompoundExp(exp))
        return makeOk(makeGraph(makeTD(),mapCompExp(exp)));
    return makeFailure("Cexp but not atomic or compound graph\n")
   }
   else
   return makeFailure("Not Cexp\n")
}
export const mapL4DefExptoMermaid = (exp: DefineExp): Result<Graph> =>{
    //var: VarDecl; val: CExp;
    const defineNode:Node = makeNodeDecl(varGenDefine("DefineExp"),"DefineExp")
    const varNode:Node = makeNodeDecl(varGenVardecl("VarDecl"),"VarDecl("+exp.var.var+")")
    const varEdge:Edge[] = [makeEdge(defineNode,varNode,makeEdgeLabel("var"))]

    const recValEdges:Edge[] = makeCexpEdges(exp.val,defineNode,"val")
    const edges = varEdge.concat(recValEdges)
    return makeOk(makeGraph(makeTD(),makeCompoundGraph(edges)))
}


export const mapL4ProgramtoMermaid = (exp: Program): Result<Graph> =>{
        const programNode : Node = makeNodeDecl(varGenProgram("Program"),"Program")
        const expsGraphs :Result<Graph>[] =  map(x=>mapL4toMermaid(x),exp.exps);
        const recExpsDownEdges:Edge[][] = map(x=>
                                              isOk(x)?
                                                    isAtomicGraph(x.value.graphContent)?
                                                        [makeEdge(programNode,x.value.graphContent.node)]:
                                                    isCompoundGraph(x.value.graphContent)?
                                                        x.value.graphContent.edges: 
                                                    [makeEdge(makeNodeDecl("Null","Null"),makeNodeDecl("Null","Null"))] :
                                              [makeEdge(makeNodeDecl("Null","Null"),makeNodeDecl("Null","Null"))],expsGraphs)

        const expsNodes : Node[] = recExpsDownEdges.map(x=>x[0].from)
        const expsDownEdges: Edge[] = recExpsDownEdges.reduce((acc,curr) => acc.concat(curr), []);
        const edges : Edge[] = expsNodes.map(x=>makeEdge(programNode,x)).concat(expsDownEdges)
       return makeOk(makeGraph(makeTD(),makeCompoundGraph(edges)))
}

export const mapAtomicExp = (exp: AtomicExp): AtomicGraph =>
//AtomicExp = NumExp | BoolExp | StrExp | PrimOp | VarRef
    isNumExp(exp)? makeAtomicGraph(makeNodeDecl(varGenNum("NumExp"),"NumExp("+exp.val+")")) : 
    isBoolExp(exp)? makeAtomicGraph(makeNodeDecl(varGenRands("BoolExp"),"BoolExp("+exp.val+")")) :
    isStrExp(exp)? makeAtomicGraph(makeNodeDecl(varGenRands("StrExp"),"StrExp("+exp.val+")")):
    isPrimOp(exp)? makeAtomicGraph(makeNodeDecl(varGenRands("PrimOp"),"PrimOp("+exp.op+")")):
    isVarRef(exp)? makeAtomicGraph(makeNodeDecl(varGenRands("VarRef"),"VarRef("+exp.var+")")):
    makeAtomicGraph(makeNodeDecl("null","null"));

export const mapCompExp = (exp: CompoundExp): CompoundGraph =>
//CompoundExp = AppExp | IfExp | ProcExp | LetExp | LitExp | LetrecExp | SetExp;
    isAppExp(exp)? makeCompoundGraph(mapL4AppToMermaid(exp)):
    isIfExp(exp)?  makeCompoundGraph(mapL4IfToMermaid(exp)) : 
    isProcExp(exp)?  makeCompoundGraph(mapL4ProcToMermaid(exp)): 
    isLetExp(exp)?  makeCompoundGraph(mapL4LetToMermaid(exp)): 
    isLitExp(exp)?  makeCompoundGraph(mapL4LitToMermaid(exp)): 
    isLetrecExp(exp)? makeCompoundGraph(mapL4LetrecToMermaid(exp)): 
    isSetExp(exp)?  makeCompoundGraph(mapL4SetToMermaid(exp)) : 
    makeCompoundGraph([makeEdge(makeNodeDecl("null","null"),makeNodeDecl("null","null"))]);


export const mapL4AppToMermaid = (exp: AppExp): Edge[] =>{
    
    //Head node
    const appExpNode :Node = makeNodeDecl(varGenRands("AppExp"),"AppExp")

    //Rator node handle
    const ratorDownEdges :Edge[] = makeCexpEdges(exp.rator,appExpNode,"rator")
    
    //Rand nodes
    const randsPointerNode = makeNodeDecl(varGenRands("Rands"),":")
    const randsPtrEdge :Edge[] = [makeEdge(appExpNode, randsPointerNode, makeEdgeLabel("rands"))]
    const recursiveEdges :Edge[][] = exp.rands.map(x=>makeCexpEdges(x,randsPointerNode))

    const downEdges: Edge[] = recursiveEdges.reduce((acc,curr) => acc.concat(curr), []);       //edges from the recursion
    const edges = randsPtrEdge.concat(ratorDownEdges, downEdges)
    return edges;
}

const mapL4IfToMermaid = (exp:IfExp): Edge[] => {
        //test: CExp; then: CExp; alt: CExp;

        const ifExpNode :Node = makeNodeDecl(varGenIf("IfExp"),"IfExp")
        
        const testEdges :Edge[] = makeCexpEdges(exp.test,ifExpNode,"test")
        const thenEdges :Edge[] = makeCexpEdges(exp.then,ifExpNode,"then")
        const altEdges :Edge[] = makeCexpEdges(exp.alt,ifExpNode,"alt")
        const edges = testEdges.concat(thenEdges,altEdges);
        return edges;
}
    

const mapL4ProcToMermaid = (exp:ProcExp): Edge[] => {
    //args: VarDecl[], body: CExp[];
    const ProcExpNode :Node = makeNodeDecl(varGenProc("ProcExp"),"ProcExp")
    const argsPointerNode = makeNodeDecl(varGenParams("Params"),":")
    const bodyPointerNode = makeNodeDecl(varGenBody("Body"),":")
    const argsPtrEdge :Edge[] = [makeEdge(ProcExpNode, argsPointerNode, makeEdgeLabel("args"))]
    const bodyPtrEdge :Edge[] = [makeEdge(ProcExpNode, bodyPointerNode, makeEdgeLabel("body"))]

    const argsNodes: Node[] = exp.args.map(x => makeNodeDecl(varGenVardecl("VarDecl"),"VarDecl"+"("+x.var+")"))

    const recBodyEdges: Edge[][] = exp.body.map(x => makeCexpEdges(x,bodyPointerNode))
    const argsEdges: Edge[] = map(x => makeEdge(argsPointerNode,x) ,argsNodes)
    const downEdges: Edge[] = recBodyEdges.reduce((acc,curr) => acc.concat(curr), []);
    
    const edges = argsPtrEdge.concat(bodyPtrEdge,argsEdges,downEdges)
    return edges;
}

const mapL4LetToMermaid = (exp:LetExp): Edge[] =>{
    //bindings: Binding[]; body: CExp[];
    
    const LetExpNode :Node = makeNodeDecl(varGenLet("LetExp"),"LetExp")
    const bindingsPointerNode = makeNodeDecl(varGenBindings("Bindings"),":")
    const bodyPointerNode = makeNodeDecl(varGenBody("Body"),":")

    
    const bindingsPtrEdge :Edge[] = [makeEdge(LetExpNode, bindingsPointerNode, makeEdgeLabel("bindings"))]
    const bodyPtrEdge :Edge[] = [makeEdge(LetExpNode, bodyPointerNode, makeEdgeLabel("body"))]

    
    const recBindingsEdges: Edge[][] = exp.bindings.map(x =>mapBindingToMermaid(x))
    const bindingsNodes : Node[] = recBindingsEdges.map(x=>x[0].from)

    const recBodyEdges: Edge[][] = exp.body.map(x => makeCexpEdges(x,LetExpNode))

    const bindingsEdges: Edge[] = map(x => makeEdge(bindingsPointerNode,x) ,bindingsNodes)
    const downBindingsEdges: Edge[] = recBindingsEdges.reduce((acc,curr) => acc.concat(curr), []);
    const downBodyEdges: Edge[] = recBodyEdges.reduce((acc,curr) => acc.concat(curr), []);
    const edges = bindingsPtrEdge.concat(bindingsEdges,bodyPtrEdge,downBindingsEdges,downBodyEdges)
    return edges;
}
     
const mapBindingToMermaid = (exp:Binding): Edge[] =>{
    //Binding: var: VarDecl; val: CExp; 
    const BindingNode :Node = makeNodeDecl(varGenBindings("Binding"),"Binding")
    const VarDeclNode :Node = makeNodeDecl(varGenVardecl("VarDecl"),"VarDecl"+"("+exp.var+")")
    
    const ValEdges :Edge[] = makeCexpEdges(exp.val,BindingNode)
    const edges :Edge[] = [makeEdge(BindingNode,VarDeclNode)].concat(ValEdges)
    return edges
}

const mapL4LitToMermaid = (exp:LitExp): Edge[] =>{
    //val: SExpValue;
       
    const LitExpNode :Node = makeNodeDecl(varGenLit("LitExp"),"LitExp")
    const SExpValueEdges :Edge[] = mapL4SExpValueMermaid(exp.val,LitExpNode,"val")
    return SExpValueEdges
}

const mapL4SExpValueMermaid = (exp:SExpValue, prevNode :Node, label:string): Edge[] =>{
    //SExpValue = number | boolean | string | PrimOp | Closure | SymbolSExp | EmptySExp | CompoundSExp;
    if(isNumber(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenNum("number"),"number"+"("+exp+")"),makeEdgeLabel(label))]
    if(isBoolean(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenBool("boolean"),"boolean"+"("+exp+")"),makeEdgeLabel(label))]
    if(isString(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenStr("string"),"string"+"("+exp+")"),makeEdgeLabel(label))]
    if(isPrimOp(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenPrimOp("PrimOp"),"PrimOp"+"("+exp+")"),makeEdgeLabel(label))]
    if(isEmptySExp(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenEmpySExp("EmptySExp"),"EmptySExp"),makeEdgeLabel(label))]
    if(isSymbolSExp(exp)) return [makeEdge(prevNode,makeNodeDecl(varGenSymbolSExp("SymbolSExp"),"SymbolSExp"+"("+exp.val+")"),makeEdgeLabel(label))]  
    if(isCompoundSExp(exp)){ 
    const compGraph = mapL4CompoundSExpToMermaid(exp)
    return [makeEdge(prevNode,compGraph[0].from,makeEdgeLabel(label))].concat(compGraph)}
    else
    return [makeEdge(makeNodeDecl("null","null"),makeNodeDecl("null","null"))];
    
}


const mapL4CompoundSExpToMermaid = (exp: CompoundSExp): Edge[] => {
    //(val1: SExpValue, val2: SExpValue)
    const CompoundSExpNode :Node = makeNodeDecl(varGenCompoundSExp("CompoundSExp"),"CompoundSExp")
    const val1Edges :Edge[] = mapL4SExpValueMermaid(exp.val1,CompoundSExpNode,"val1");
    const val2Edges :Edge[] = mapL4SExpValueMermaid(exp.val2,CompoundSExpNode,"val2");
    const edges: Edge[] = val1Edges.concat(val2Edges)
    return edges;
}
    
const mapL4LetrecToMermaid = (exp: LetrecExp): Edge[] => {
    //bindings: Binding[]; body: CExp[];
    const LetRecNode :Node = makeNodeDecl(varGenLetrec("LetRec"),"LetRec")
    const bindingsPointerNode = makeNodeDecl(varGenBindings("Bindings"),":")
    const bodyPointerNode = makeNodeDecl(varGenBody("Body"),":")
    const bindingsPtrEdge :Edge[] = [makeEdge(LetRecNode, bindingsPointerNode, makeEdgeLabel("bindings"))]
    const bodyPtrEdge :Edge[] = [makeEdge(LetRecNode, bodyPointerNode, makeEdgeLabel("body"))]

    
    const recBindingsEdges: Edge[][] = exp.bindings.map(x =>mapBindingToMermaid(x))
    const bindingsNodes : Node[] = recBindingsEdges.map(x=>x[0].from)

    
    const recBodyEdges: Edge[][] = exp.body.map(x => makeCexpEdges(x,LetRecNode))


    const bindingsEdges: Edge[] = map(x => makeEdge(bindingsPointerNode,x) ,bindingsNodes)
    const downBindingsEdges: Edge[] = recBindingsEdges.reduce((acc,curr) => acc.concat(curr), []);
    const downBodyEdges: Edge[] = recBodyEdges.reduce((acc,curr) => acc.concat(curr), []);
    const edges = bindingsPtrEdge.concat(bindingsEdges,bodyPtrEdge,downBindingsEdges,downBodyEdges)
    return edges;
}
const mapL4SetToMermaid = (exp: SetExp): Edge[] =>{
    //var: VarRef; val: CExp;
    const SetExpNode :Node = makeNodeDecl(varGenSetExp("SetExp"),"SetExp")
    const VarDeclNode :Node = makeNodeDecl(varGenVardecl("VarDecl"),"VarDecl"+"("+exp.var+")")
    const ValEdges :Edge[] = makeCexpEdges(exp.val,SetExpNode)
    const edges :Edge[] = [makeEdge(SetExpNode,VarDeclNode)].concat(ValEdges)
    return edges
    
}
export const makeCexpEdges = (exp: CExp, prevNode: Node, label?:string): Edge[] =>{
    if(isAtomicExp(exp)) 
        return [makeEdge(prevNode, mapAtomicExp(exp).node,makeEdgeLabel(isUndefined(label)?"":label))]
    else if(isCompoundExp(exp)){ 
        const compGraph = mapCompExp(exp)
        return [makeEdge(prevNode,compGraph.edges[0].from,makeEdgeLabel(isUndefined(label)?"":label))].concat(compGraph.edges)}
    else
        return [makeEdge(makeNodeDecl("Null","Null"),makeNodeDecl("Null","Null"))];
    }
