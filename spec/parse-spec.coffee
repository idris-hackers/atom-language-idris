sexpFormatter = require '../lib/utils/sexp-formatter'
parse = require '../lib/parse'
runP = require('bennu').parse.run

test1 = "(:protocol-version 1 0)"
list1 = [':protocol-version', 1, 0]

test2 = "(:set-prompt \"*C:\\Programming\\Idris\\Start\\hello\" 1)"
list2 = [":set-prompt", "*C:\\Programming\\Idris\\Start\\hello", 1]

test3 = "(:return (:ok ()) 5)"
list3 = [":return", [":ok", []], 5]

test4 = """(:return (:ok "Main.a : Nat" ((0 6 ((:name "Main.a") (:implicit :False) (:decor :function) (:doc-overview "") (:type "Nat"))) (9 3 ((:name "Prelude.Nat.Nat") (:implicit :False) (:decor :type) (:doc-overview "Unary natural numbers") (:type "Type"))) (9 3 ((:tt-term "AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU="))))) 2)"""
list4 =
  [
    ":return",
    [
      ":ok",
      "Main.a : Nat",
      [
        [
          0,
          6,
          [
            [":name", "Main.a"],
            [":implicit", false],
            [":decor", ":function"],
            [":doc-overview", ""],
            [":type", "Nat"]
          ]
        ],
        [
          9,
          3,
          [
            [":name", "Prelude.Nat.Nat"],
            [":implicit", false],
            [":decor", ":type"],
            [":doc-overview", "Unary natural numbers"]
            [":type", "Type"]
          ]
        ],
        [
          9,
          3,
          [
            [
              ":tt-term", "AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU="
            ]
          ]
        ]
      ]
    ],
    2
  ]

test5 = """(:return (:ok "\\"Z\\" : String" ((0 3 ((:name "\\"Z\\""))))) 5)"""
list5 =
  [
    ":return"
    [
      ":ok"
      '"Z" : String'
      [
        [
          0
          3
          [
            [
              ":name"
              '"Z"'
            ]
          ]
        ]
      ]
    ]
    5
  ]

describe "The sub-parser(s)", ->
  it "for :True and :False should work.", ->
    expect(runP(parse.trueP, ':True')).toEqual(true)
    expect(runP(parse.falseP, ':False')).toEqual(false)

  it "for integers should work.", ->
    expect(runP(parse.integerP, '2345')).toEqual(2345)
    expect(runP(parse.integerP, '1')).toEqual(1)

  it "for symbols should work.", ->
    expect(runP(parse.symbolP, ':sym')).toEqual(':sym')

  it "for string chars should work.", ->
    expect(runP(parse.stringCharP, 'h')).toEqual('h')
    expect(runP(parse.stringCharP, '\\"')).toEqual('"')

  it "for strings should work.", ->
    expect(runP(parse.stringP, '"hello"')).toEqual('hello')
    expect(runP(parse.stringP, '"\\"Z\\""')).toEqual('"Z"')
    expect(runP(parse.stringP, '"\\"Z\\" : String"')).toEqual('"Z" : String')

describe "A parser", ->
  it "should parse to the right list.", ->
    expect(parse.parse(test1)).toEqual(list1)
    expect(parse.parse(test2)).toEqual(list2)
    expect(parse.parse(test3)).toEqual(list3)
    expect(parse.parse(test4)).toEqual(list4)
    expect(parse.parse(test5)).toEqual(list5)

  it "should serialize back again.", ->
    expect(sexpFormatter.formatSexp(list1)).toEqual(test1)
    expect(sexpFormatter.formatSexp(list2)).toEqual(test2)
    expect(sexpFormatter.formatSexp(list3)).toEqual(test3)
    expect(sexpFormatter.formatSexp(list4)).toEqual(test4)

  it "should serialize common commands.", ->
    loadFile = [[':load-file', "idris.idr"], 1]
    expect(sexpFormatter.formatSexp(loadFile)).toEqual '((:load-file "idris.idr") 1)'
