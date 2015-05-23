highlighter = require '../lib/utils/highlighter'

describe "The highlighter", ->
  it "should highlight correctly.", ->
    code1 = "Prelude.Nat.Nat : Type"
    info1 =
      [
        [
          0,
          15,
          [
            [":name","Prelude.Nat.Nat"],
            [":implicit",false],
            [":decor",":type"],
            [":doc-overview","Unary natural numbers"],
            [":type","Type"],
            [":namespace","Prelude.Nat"]
          ]
        ],
        [
          18,
          4,
          [
            [":decor",":type"],
            [":type","Type"],
            [":doc-overview","The type of types"],
            [":name","Type"]
          ]
        ],
        [
          18,
          4,
          [
            [":tt-term","AAAAAAAAAAAHAP//////////"]
          ]
        ]
      ]
    should1 = '<span class="storage type idris">Prelude.Nat.Nat</span> : <span class="storage type idris">Type</span>'

    expect(highlighter.highlight(code1, info1)).toEqual(should1)
