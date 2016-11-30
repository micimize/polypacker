import fs from 'fs'
import path from 'path'
import { selectTask, splitter } from './utils'
import { devServerRunner } from '../runners'

function split(args){
  return [
    {singular: 'env', plural: 'environments'},
    {singular: 'context', plural: 'contexts'},
  ].reduce((args, map) => splitter(map)(args), args)
}

const derivedEnv = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT'

function combineOut({ outCombinator: combinator, outPrefix, ...args }){
  args.env = args.env || derivedEnv
  if(args.context){
    args.out = path.join(args.out || '', outPrefix || '', (
      [args.context, args.env].reduce((combined, vector='') => (combined ? (combined + combinator) : '') + vector.toLowerCase(), '') + '.js'
    ))
  }
  return args
}

export default function postProcess(args){
  let  { task, run, runner, logLevel, ...compilerArgs } = args
  task = task || selectTask(args)
  let compilers = split(compilerArgs)
  if(compilers.length > 1)
    compilers = compilers.map(combineOut);
  return {compilers, manager: {task, run, runner, logLevel}}
}
