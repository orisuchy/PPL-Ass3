// Environment for L4 (support for Letrec)
// =======================================
// An environment represents a partial function from symbols (variable names) to values.
// It supports the operation: apply-env(env,var)
// which either returns the value of var in the environment, or else throws an error.
//
// Env is defined inductively by the following cases:
// * <env> ::= <empty-env> | <extended-env> | <rec-env>
// * <empty-env> ::= (empty-env) // empty-env()
// * <extended-env> ::= (env (symbol+) (value+) next-env) // env(vars:List(Symbol), vals:List(Value), next-env: Env)
// * <rec-ext-env> ::= (rec-env (symbol+) (params+) (bodies+) next-env)
//       // rec-env(vars:List(Symbol), paramss:List(List(var-decl)), bodiess:List(List(cexp)), next-env: Env)
//
// The key operation on env is apply-env(var) which returns the value associated to var in env
// or throw an error if var is not defined in env.

import { VarDecl, CExp, ProcExp } from './L4-ast';
import { makeClosure, Value } from './L4-value';
import { Result, makeOk, makeFailure } from '../shared/result';
import { pair } from 'ramda';

// ========================================================
// Environment data type
export type Env = EmptyEnv | ExtEnv | ProcEnv //| RecEnv;
export interface EmptyEnv {tag: "EmptyEnv" }
export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    vals: EnvPair[];
    nextEnv: Env;          // my daddy
}
/*
export interface RecEnv {
    tag: "RecEnv";
    vars: string[];
    paramss: VarDecl[][];
    bodiess: CExp[][];
    nextEnv: Env;
}
*/
export interface EnvPair {
    tag: "EnvPair";
    value: CExp;
    env: Env;        // the enviroment that the variable was created in
}

export interface ProcEnv { //Speacial environment for procedures
    tag: "ProcEnv";
    vars: string[];
    vals: ProcExp[];
    nextEnv: Env;
}

export const makeEnvPair = (value: CExp, env: Env):EnvPair => ({tag: "EnvPair",value: value, env: env})
export const makeEmptyEnv = (): EmptyEnv => ({tag: "EmptyEnv"});
export const makeExtEnv = (vs: string[], vals: EnvPair[], env: Env): ExtEnv =>
    ({tag: "ExtEnv", vars: vs, vals: vals, nextEnv: env});

export const makeProcEnv = (vs: string[], vals: ProcExp[], env: Env): ProcEnv =>
    ({tag: "ProcEnv", vars: vs, vals: vals, nextEnv: env});
/*
export const makeRecEnv = (vs: string[], paramss: VarDecl[][], bodiess: CExp[][], env: Env): RecEnv =>
    ({tag: "RecEnv", vars: vs, paramss: paramss, bodiess: bodiess, nextEnv: env});
*/

const isEmptyEnv = (x: any): x is EmptyEnv => x.tag === "EmptyEnv";
const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";
const isProcEnv = (x: any): x is ProcEnv => x.tag === "ProcEnv";
//const isRecEnv = (x: any): x is RecEnv => x.tag === "RecEnv";
const isEnvPair = (x: any): x is EnvPair => x.tag === "EnvPair";

export const isEnv = (x: any): x is Env => isEmptyEnv(x) || isExtEnv(x) || isProcEnv(x)// || isRecEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<EnvPair> =>
    isEmptyEnv(env) ? makeFailure(`var not found ${v}`) :
    isExtEnv(env) ? applyExtEnv(env, v) :
    //makeFailure(`var not found ${v}`)
    applyProcEnv(env, v); //changed for pair

const applyExtEnv = (env: ExtEnv, v: string): Result<EnvPair> =>
    env.vars.includes(v) ? makeOk(env.vals[env.vars.indexOf(v)]) :
    applyEnv(env.nextEnv, v);
////////added for pair with proc
const applyProcEnv = (env: ProcEnv, v: string): Result<EnvPair> =>
    env.vars.includes(v) ? makeOk(makeEnvPair(env.vals[env.vars.indexOf(v)], env)) :
    applyEnv(env.nextEnv, v);