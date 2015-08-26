volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
articles = new Mongo.Collection('articles');
articleTypes = new Mongo.Collection('articleTypes'); //when saving an article query this db and add the name, short_name and id as an object to the article

if (Meteor.isServer) {
  Meteor.publish('volumes', function () {
    return volumes.find({},{sort : {volume:-1}});
  });
  Meteor.publish('issues', function () {
    return issues.find({},{sort : {volume:1}});
  });
  Meteor.publish('articles', function () {
    return articles.find({},{sort : {page_start:1}});
  });
}
if (Meteor.isClient) {
	//TODO: remove global subscribe to collections
	Meteor.subscribe('volumes');
	Meteor.subscribe('issues');
}