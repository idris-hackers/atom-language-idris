
parse = require '../lib/parse'

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

describe "A parser", ->
  it "should parse to the right list.", ->
    expect(parse.parse(test1)).toEqual(list1)
    expect(parse.parse(test2)).toEqual(list2)
    expect(parse.parse(test3)).toEqual(list3)
    expect(parse.parse(test4)).toEqual(list4)
