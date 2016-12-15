import * as defaultPresetMap from './presetMap'
import { byRequire as extendbyRequire } from '../extensible'

function metaArgs(conf){
  return {logLevel: conf.logLevel}
}

export const presets = extendbyRequire({
  merger(base, presets){
    return Object.assign(base, ...presets)
  },
  defaults: defaultPresetMap,
  path: ['parser', 'presets']
})

export default function apply(args){
  var preset = args.preset
  delete args.preset
  if (preset && presets[preset]) {
    return presets[preset](args)
  } else {
    return args
  }
}
