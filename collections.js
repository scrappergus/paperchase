volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');

if (Meteor.isServer) {
  Meteor.publish('volumes', function () {
    return volumes.find({},{sort : {volume:-1}});
  });
  Meteor.publish('issues', function () {
    return issues.find({},{sort : {volume:1}});
  });
}
if (Meteor.isClient) {
	//TODO: remove global subscribe to collections
	Meteor.subscribe('volumes');
	Meteor.subscribe('issues');
}