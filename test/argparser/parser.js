import 'babel-polyfill'
import { assert } from 'chai'
import { parseArgs } from '../../src/argparser/parser'
import argumentMap from '../../src/argparser/argumentMap'
import G from 'generatorics'

function* combinationGenerator(components){
    let cartesian = [...G.cartesian(...components)]
    //let powerSet = [...G.powerSet(cartesian)]
    for (var combination of cartesian ) {  
        yield combination.reduce((test, item) => {
            let {input, expected} = item
            return {
                input: `${test.input} ${input}`,
                expected: Object.assign(test.expected, expected)
            }
        }, {input: '', expected: {}})
    }
}

function inputString({alias, value}){
    return Array.isArray(value) ?
        value.map(value => inputString({alias, value})).join(' ') :
            value !== null ?
                `--${alias} ${value}` :
                `--${alias}`
}

function buildTestShape({alias, dest, values: {sourceValue, destValue}}){
    return sourceValue !== undefined ? {
        input: inputString({alias, value: sourceValue}),
        expected: {[dest]: destValue}
    } :  { input: '', expected: {} }
}

function* testShapeGenerator(cartesian){
    for (var [alias, values, dest] of cartesian) {  
        yield buildTestShape({alias, values, dest})
    }
}

const actionResult = {
    store(values){
        return values.map(sourceValue => ({
            sourceValue, destValue: sourceValue
        }))
    },
    append(values){
        return [...G.powerSet(values)].map(sourceValue => ({
            sourceValue, destValue: sourceValue
        }))
    },
    storeTrue: () => [{sourceValue: null, destValue: true}]
}

function expandPossibilities(action, {aliases, choices, dest, }){
    let values = actionResult[action](choices)
    return [...testShapeGenerator(G.cartesian(aliases, values, [dest]))]
}

function ruleNegotiator({key, argDefinition: {action='store', aliases=[], choices, dest}, values: {positive} = {}}){
    dest = dest || key
    aliases.push(key)
    choices = positive || choices
    choices = Array.isArray(choices) ? choices : [choices]
    let vectors = {aliases, choices, dest}
    return expandPossibilities(action, vectors)
}

const nonDerivedValues = {
    entry: {
        positive: ['./src/index.js']
    },
    out: {
        positive: ['./dist/main.js']
    },
    run: {
        positive: ['NODE']
    },
    modules: {
        positive: ['./src/']
    },
    babelPreset: {
        positive: ['react']
    },
    preset: {
        positive: ['REACT_COMPONENT']
    }
}


function negotiateAllOptions(args){
    let components = Object.keys(args).map(key => ruleNegotiator({
        key, argDefinition: args[key], values: nonDerivedValues[key]
    }))
    return combinationGenerator(components)
}

function testAllAgainst(func, generator){
    for (var {input, expected} of generator) {
        let actual = Object.assign({}, func(input).config)
        assert.deepEqual(actual, expected) 
    }
}

describe('parser', _ => {
    it('should parse all combinations', done => {
        testAllAgainst(parseArgs, negotiateAllOptions(argumentMap))
        done()
    })
})
