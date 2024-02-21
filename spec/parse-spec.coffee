sexpFormatter = require '../lib/protocol/sexp-formatter'
parse = require '../lib/utils/parse'
runP = require('bennu').parse.run

toSexp = (data) ->
  switch (typeof data)
    when 'object'
      if (data instanceof Array)
        {type: 'list', data: data.map(toSexp)}
    when 'string'
      if data[0] == ':'
        {
          type: 'symbol'
          data: data[1..]
        }
      else
        {type: 'string', data}
    when 'number'
      {type: 'integer', data}
    when 'boolean'
      {type: 'bool', data}

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

test6 = """(:return (:ok "\\\\__pi_arg => \\\\__pi_arg1 => (__pi_arg1)") 6)"""
list6 =
  [
    ":return"
    [
      ":ok"
      "\\__pi_arg => \\__pi_arg1 => (__pi_arg1)"
    ]
    6
  ]

test7 = "(:interpret \":cd C:/Path/to/dir\")"
list7 =
  [
    ":interpret"
    ":cd C:/Path/to/dir"
  ]
sexp7 =
  {
    type: 'list'
    data: [
      {type: 'symbol', data: "interpret"}
      {type: "string", data: ":cd C:/Path/to/dir"}
    ]
  }

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
    expect(parse.parseCommand(test1)).toEqual(list1)
    expect(parse.parseCommand(test2)).toEqual(list2)
    expect(parse.parseCommand(test3)).toEqual(list3)
    expect(parse.parseCommand(test4)).toEqual(list4)
    expect(parse.parseCommand(test5)).toEqual(list5)
    expect(parse.parseCommand(test6)).toEqual(list6)

  it "should serialize back again.", ->
    expect(sexpFormatter.formatSexp(toSexp(list1))).toEqual(test1)
    expect(sexpFormatter.formatSexp(toSexp(list2))).toEqual(test2)
    expect(sexpFormatter.formatSexp(toSexp(list3))).toEqual(test3)
    expect(sexpFormatter.formatSexp(toSexp(list4))).toEqual(test4)
    expect(sexpFormatter.formatSexp(sexp7)).toEqual(test7)

  it "should serialize common commands.", ->
    loadFile = toSexp [[':load-file', "idris.idr"], 1]
    expect(sexpFormatter.formatSexp(loadFile)).toEqual '((:load-file "idris.idr") 1)'
