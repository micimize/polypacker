const identity = Symbol('polypacker')

const derivedEnv = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT'

function compound({context, env}){
    return (context && env) ? context.toLowerCase() + '_' + env.toLowerCase() : 'index'
}

export function sign(obj = {}){
    let { entry, out, hot, context, env = derivedEnv } = obj
    obj[identity] = {
        signature: compound({context, env}),
        entry, out, hot
    }
    return obj
}

export default identity
