# slow method to compare objects.
objectEqual = (a, b) ->
  JSON.stringify(a) == JSON.stringify(b)

module.exports =
  objectEqual: objectEqual
