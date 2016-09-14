import 'babel-polyfill'
import { assert } from 'chai'

process.env.CONFIGURATION_FILE = __dirname + '/../configuration.json'

import { parser } from 'simple-test-polypacker-plugin'
const schema = require( '../../src/parser/parser').schema

describe('parser schema', _ => {
    it('should be have attributes from simple-test-polypacker-plugin added', done => {
        let additional = schema.definitions['simple-test-polypacker-plugin']
        assert.deepEqual(additional, parser.argumentSchema) 
        done()
    })
})
