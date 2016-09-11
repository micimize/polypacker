import { compileAll, watchAll, runSelected } from './tasks'

import * as utils from './utils'
import * as builders from './builders'

let { exit, chain } = utils

export default {
    'compile': chain(compileAll, exit),
    'watch': watchAll,
    'run': chain(compileAll, runSelected),
    'watch-and-run': chain(watchAll, runSelected)
}

export { utils, builders }
