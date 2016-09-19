import colors from 'colors'
import identity from './identity'

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

export function logImportantFromToAction(acting, {[identity]: {entry, out}}, color='cyan'){
  importantLog(`${acting} from '${colors[color](entry)}' to '${colors[color](out)}'`)
}

export function logCompilation(err, stats, {logLevel, signature}) {
  var status = 'success'
  if(err) {
    importantLog(colors.red(`Errors while building ${signature}!`), {color: 'red'})
    log('Error', err);
    status = 'error'
  } else if(stats.hasErrors()) {
    importantLog(colors.red(`Errors while building ${signature}!`), {color: 'red'})
    log(stats.toString({colors: true, errorDetails: true}));
    status = 'error'
  } else {
    importantLog('successfully built ' + colors.cyan(signature))
  }
  if(logLevel == 'VERBOSE') {
    log(stats.toString({colors: true}));
  }
  return {
    compiler: signature,
    status
  }
}

