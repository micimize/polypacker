import 'babel-polyfill'
import { assert } from 'chai'
import { parseArgs } from '../../src/parser/parser'
import argumentMap from '../../src/parser/argumentMap'
import G from 'generatorics'

function combine(combination, defaultMap){
    return combination.reduce((test, {input, expected}) => ({
            input: input ? `${test.input} ${input}` : test.input,
            expected: Object.assign(test.expected, expected)
    }), {input: '', expected: Object.assign({}, defaultMap)})
}

function* powerSetGenerator(combination, defaultMap){
    for (var subset of G.powerSet(combination)) {  
        yield combine(subset, defaultMap)
    }
}

function* cartesianGenerator(snippets, defaultMap){
    let cartesian = G.cartesian(...snippets)
    for (var combination of cartesian) {  
        yield combine(combination, defaultMap)
    }
}

function* fullPowerSetGenerator(snippets, defaultMap){
    for (var combination of cartesianGenerator(snippets, defaultMap)) {  
        yield* powerSetGenerator(combination, defaultMap)
    }
}

function* singlePowerSetGenerator(snippets, defaultMap){
    yield* powerSetGenerator([...G.cartesian(...snippets)][0], defaultMap)
}

function inputString({alias, value}){
    return Array.isArray(value) ?
        value.map(value => inputString({alias, value})).join(' ') :
            value !== null ?
                `${alias} ${value}` :
                alias
}

function buildTestShape({alias, dest, values: {sourceValue, destValue}, defaultValue}){
    return sourceValue !== undefined ? {
        input: inputString({alias, value: sourceValue}),
        expected: {[dest]: destValue}
    } :  { input: '', expected: {[dest]: defaultValue} }
}

function* testShapeGenerator(cartesian){
    for (var [alias, values, dest, defaultValue] of cartesian) {  
        yield buildTestShape({alias, values, dest, defaultValue})
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

function getDefaultValue({action, defaultValue}){
    if(defaultValue === undefined){
        defaultValue = action == 'append' ? null :
                       action == 'storeTrue' ? false :
                       null
    }
    return defaultValue
}

function expandPossibilities(action, {aliases, choices, dest, defaultValue}){
    let values = actionResult[action](choices)
    defaultValue = getDefaultValue({action, defaultValue})
    return [...testShapeGenerator(G.cartesian(aliases, values, [dest], [defaultValue]))]
}

function buildDefault(argumentMap){
    return Object.keys(argumentMap).reduce((obj, key) => {
        obj[argumentMap[key].dest || key] = getDefaultValue(argumentMap[key])
        return obj
    }, {})
}

function ruleNegotiator({key, argDefinition: {action='store', aliases=[], choices, dest, defaultValue}, values: {positive} = {}}){
    dest = dest || key
    aliases.push(`--${key}`)
    choices = positive || choices
    choices = Array.isArray(choices) ? choices : [choices]
    let vectors = {aliases, choices, dest, defaultValue}
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


function testAllAgainst(func, generator){
    return cb => {
         while(true) {
            let { value: { input, expected} = {}, done } = generator.next()
            if(done)
                break;
            let actual = Object.assign({}, func(input).config)
            assert.deepEqual(actual, expected) 
         }
         cb()
    }
}
function allSnippetPossibilities(args){
    return Object.keys(args).map(key => ruleNegotiator({
        key, argDefinition: args[key], values: nonDerivedValues[key]
    }))
}

describe('parser', _ => {
    let snippetPossibilities = allSnippetPossibilities(argumentMap)
    let defaultMap = buildDefault(argumentMap)

    it('should parse a powerset', testAllAgainst(
        parseArgs,
        singlePowerSetGenerator(snippetPossibilities, defaultMap)
    ))

    it('should parse all full option combinations', testAllAgainst(
        parseArgs,
        cartesianGenerator(snippetPossibilities, defaultMap)
    ))

    if(process.env.TEST_DEPTH == 'EXTREME'){
        it('should parse the powerset of ALL option combinations', testAllAgainst(
            parseArgs,
            fullPowerSetGenerator(snippetPossibilities, defaultMap)
        ))
    }
})
