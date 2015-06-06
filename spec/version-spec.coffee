utils = require '../lib/utils/version'

describe "The version", ->
  it "should parse correctly.", ->
    expect(utils.parseVersion('0.9.15.1')).toEqual([0, 9, 15, 1])
    expect(utils.parseVersion('0.9.17')).toEqual([0, 9, 17])
    expect(utils.parseVersion('0.9.18-')).toEqual([0, 9, 18])
    expect(utils.parseVersion("0.9.18-\n")).toEqual([0, 9, 18])

  it "should compare correctly.", ->
    expect(utils.versionGreaterEq([0, 9, 15, 1], [0, 9, 17])).toEqual(false)
    expect(utils.versionGreaterEq([0, 9, 14], [0, 9, 17])).toEqual(false)
    expect(utils.versionGreaterEq([0, 9, 18], [0, 9, 17])).toEqual(true)
    expect(utils.versionGreaterEq([0, 9, 17], [0, 9, 17])).toEqual(true)
