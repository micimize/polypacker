import * as presetMap from './presetMap'
import { clone, taskWrapper, selectTask, splitByContext, splitByEnv} from './utils'

function metaArgs(conf){
    return {logLevel: conf.logLevel}
}

export default function apply(args){
    var preset = args.preset
    delete args.preset
    if (preset && presetMap[preset]) {
        return presetMap[preset](args)
    } else {
        var contexts = splitByContext(args)
        var compilers = splitByEnv(contexts)
        return taskWrapper(compilers, selectTask(args), metaArgs(args))
    }
}
