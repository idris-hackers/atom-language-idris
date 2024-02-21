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
    should1 =
      [
        {
          classes: ['syntax--storage', 'syntax--type', 'syntax--idris']
          description: "Type\n\nUnary natural numbers"
          word: 'Prelude.Nat.Nat'
        }
        {
          classes: []
          description: ''
          word: ' : '
        }
        {
          classes: ['syntax--storage', 'syntax--type', 'syntax--idris']
          description: "Type\n\nThe type of types"
          word: 'Type'
        }
      ]
    should1String = '<span class="syntax--storage syntax--type syntax--idris">Prelude.Nat.Nat</span> : <span class="syntax--storage syntax--type syntax--idris">Type</span>'
    should1Html = '<span><span class="syntax--storage syntax--type syntax--idris">Prelude.Nat.Nat</span> : <span class="syntax--storage syntax--type syntax--idris">Type</span></span>'
    highlight1 = highlighter.highlight(code1, info1)
    console.log highlight1
    expect(highlight1).toEqual(should1)
    expect(highlighter.highlightToString(highlight1)).toEqual(should1String)
    html1 = highlighter.highlightToHtml(highlight1)
    expect(html1.outerHTML).toEqual(should1Html)
