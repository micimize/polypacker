import 'babel-polyfill'
import { assert } from 'chai'

process.env.CONFIGURATION_FILE = __dirname + '/../configuration.json'

import { parser } from 'simple-test-polypacker-plugin'
const { schema, presets } = require( '../../src/parser/parser')

describe('parser schema', _ => {
    it('should have attributeSchema fragment from simple-test-polypacker-plugin added', done => {
        let additional = schema.definitions['simple-test-polypacker-plugin']
        assert.deepEqual(additional, parser.argumentSchema) 
        done()
    })
    it('should have presets fragment from simple-test-polypacker-plugin added', done => {
        let additional = schema.definitions['simple-test-polypacker-plugin']
        assert.deepEqual(additional, parser.argumentSchema) 
        done()
    })
})
