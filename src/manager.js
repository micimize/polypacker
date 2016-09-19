import ON_DEATH from 'death'
import tasks, { utils as taskUtils } from './tasks'
import { sign } from './identity'

let exit = taskUtils.exit

export default function runTask({config: { compilers, manager: { task, ...meta } }, unknown, callback = _ => _}){
    task = tasks[task]
    compilers = compilers.map(sign)

    ON_DEATH((signal, err) => exit({ err, task }))

    return task(compilers, { unknown, ...meta }).then( callback ).catch(err => exit({ err, task }))
}

