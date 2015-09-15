@XMLIntake = new FS.Collection("xml-intake-fs",
  stores: [new FS.Store.GridFS("xml-intake-fs", {})]
)

XMLIntake.allow
  insert: (userId, doc) ->
    true
  download: (userId)->
    true

    Meteor.publish 'xml-intake', ->
  Images.find()
