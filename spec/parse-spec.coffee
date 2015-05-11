
parse = require '../lib/parse'

test1 = "(:protocol-version 1 0)"
shouldBe1 = ['protocol-version', 1, 0]

test2 = "(:set-prompt \"*C:\\Programming\\Idris\\Start\\hello\" 1)"
shouldBe2 = ["set-prompt", "*C:\\Programming\\Idris\\Start\\hello", 1]

test3 = """(:return (:ok "Main.a : Nat" ((0 6 ((:name "Main.a") (:implicit :False) (:decor :function) (:doc-overview "") (:type "Nat"))) (9 3 ((:name "Prelude.Nat.Nat") (:implicit :False) (:decor :type) (:doc-overview "Unary natural numbers") (:type "Type"))) (9 3 ((:tt-term "AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU="))))) 2)"""
shouldBe3 =
  [
    "return",
    [
      "ok",
      "Main.a : Nat",
      [
        [
          0,
          6,
          [
            ["name", "Main.a"],
            ["implicit", false],
            ["decor", "function"],
            ["doc-overview", ""],
            ["type", "Nat"]
          ]
        ],
        [
          9,
          3,
          [
            ["name", "Prelude.Nat.Nat"],
            ["implicit", false],
            ["decor", "type"],
            ["doc-overview", "Unary natural numbers"]
            ["type", "Type"]
          ]
        ],
        [
          9,
          3,
          [
            [
              "tt-term", "AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU="
            ]
          ]
        ]
      ]
    ],
    2
  ]

describe "when a test is written", ->
  it "has some expectations that should pass", ->
    expect(parse.parse(test1)).toEqual(shouldBe1)
    expect(parse.parse(test2)).toEqual(shouldBe2)
    expect(parse.parse(test3)).toEqual(shouldBe3)
