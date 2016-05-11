import colors from 'colors'

export function log(str){
    console.log(str)
}

export function pad(num){
    return ("0"+num).slice(-2);
}

export function shortTimestamp(){
    var d = new Date()
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + '.' + pad(d.getSeconds())
}

function upperFirst (str) {
    return typeof str !="undefined"  ? (str += '', str[0].toUpperCase() + str.substr(1)) : '' ;
}

export function prefix({color = 'magenta'} = {}){
    return colors[color]('[' + shortTimestamp() + '] ') + colors[`bg${upperFirst(color)}`](' ') 
}

export function importantLog(str, {color = 'magenta'} = {}){
  log( prefix({color}) + " " + colors.bold(str))
}

export function logImportantFromToAction(acting, {entry, out}, color='cyan'){
    importantLog(`${acting} from '${colors[color](entry)}' to '${colors[color](out)}'`)
}

function compoundVersion(options){
    var context = options.context,
        env     = options.env || process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() || 'DEVELOPMENT';
    return (context && env) ? context.toLowerCase() + '_' + env.toLowerCase() : 'index'
}

