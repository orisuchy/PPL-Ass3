// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
import { map } from "ramda";
import { CExp, Exp, IfExp, Program, parseL4Exp, isLetExp, ProcExp,
        isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,
        isPrimOp, isProcExp, isStrExp, isVarRef,
        VarDecl, LetExp, Binding, LetrecExp, PrimOp } from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env, makeExtEnv, makeRecEnv } from './L4-env-normal';
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value, Closure } from "./L4-value";
import { first, rest, isEmpty, allT } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult, safe2 } from "../shared/result";
import { parse as p } from "../shared/parser";



// Evaluate a sequence of expressions (in a program)
export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty sequence") :
    isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
    evalCExps(first(exps), rest(exps), env);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
         (parsed: Sexp) => bind(parseL4Exp(parsed),
                                (exp: Exp) => evalExps([exp], makeEmptyEnv())));

// copy paste started from here
const normalEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? bind(applyEnv(env, exp.var), (x: CExp)=>normalEval(x,env)) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isAppExp(exp) ? safe2((proc: Value, args: CExp[]) => applyProcedure(proc, args, env))
                           (normalEval(exp.rator, env), mapResult((rand: CExp) => makeOk(rand), exp.rands)) :                    
                        // (normalEval(exp.rator, env), mapResult((rand: CExp) => normalEval(rand, env), exp.rands)) :
    makeFailure(`Bad L4 AST ${exp}`);

const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(normalEval(exp.test, env),
            (test: Value) => isTrueValue(test) ? normalEval(exp.then, env) : normalEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosure(exp.args, exp.body, env));

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
// Check if need environment /////////////////////////////////////////////////////////////
const applyProcedure = (proc: Value, args: CExp[], env: Env): Result<Value> =>
    //const normalArgs = args.map(x => normalEval(x,env))
    isPrimOp(proc) ? safe2((appProc:PrimOp,appArgs:Value[])=>applyPrimitive(proc,appArgs))(makeOk(proc),mapResult(x => normalEval(x,env),args)):
    //isPrimOp(proc) ? map(bind(arg=>applyPrimitive(proc,arg)),normalArgs) :
    isClosure(proc) ? applyClosure(proc, args) :
    makeFailure(`Bad procedure ${JSON.stringify(proc)}`);


const applyClosure = (proc: Closure, args: CExp[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalExps(proc.body, makeExtEnv(vars, args, proc.env));
}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isEmpty(seq) ? makeFailure("Empty sequence") :
    isDefineExp(first(seq)) ? evalDefineExps(first(seq), rest(seq), env) :
    evalCExps(first(seq), rest(seq), env);
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isCExp(first) && isEmpty(rest) ? normalEval(first, env) :
    isCExp(first) ? bind(normalEval(first, env), _ => evalExps(rest, env)) :
    makeFailure("Never");
    
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: Exp, exps: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(exps, makeExtEnv([def.var.var], [def.val], env)):
    makeFailure("Unexpected " + def);
    

// Main program
export const evalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalParse = (s: string): Result<Value> =>
    bind(bind(p(s), parseL4Exp), (exp: Exp) => evalExps([exp], makeEmptyEnv()));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals = mapResult((b: Binding) => makeOk(b.val), exp.bindings);
    // const vals = mapResult((v: CExp) => normalEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: CExp[]) => evalExps(exp.body, makeExtEnv(vars, vals, env)));
}