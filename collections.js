volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
articles = new Mongo.Collection('articles');
articleTypes = new Mongo.Collection('articleTypes'); //when saving an article query this db and add the name, short_name and id as an object to the article
institutions = new Mongo.Collection("institutions");
ipranges = new Mongo.Collection("ipranges");
edboard = new Mongo.Collection("edboard");
authors = new Mongo.Collection('authors');
recommendations = new Mongo.Collection('recommendations');
subs = new Mongo.Collection('subscriptions');


Meteor.users.allow({
  update: function (userId, doc, fields, modifier) {
    if (userId && doc._id === userId) {
      // user can modify own
      return true;
    }
    // admin can modify any
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
articles.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
recommendations.allow({
  insert: function (userId, doc, fields, modifier) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});

articles.before.update(function (userId, doc, fieldNames, modifier, options) {
  //add affiliation number to author
  //might need to adjust this as article updates get added
  if(fieldNames.indexOf('authors') != -1){
    var authorsList = modifier['$set']['authors'];
    var affiliationsList
    affiliationsList = doc['affiliations'];

    for(var i = 0 ; i < authorsList.length ; i++){
      if(authorsList[i]['affiliations'] && affiliationsList){
        authorsList[i]['affiliation_numbers'] = [];
        for(var a = 0 ; a < authorsList[i]['affiliations'].length ; a++){
          var affiliationIndex = affiliationsList.indexOf(authorsList[i]['affiliations'][a]);
          authorsList[i]['affiliation_numbers'].push(parseInt(affiliationIndex+1));
        }
      }
    }
  }
});


issues.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
volumes.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
authors.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
institutions.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});
ipranges.allow({
  insert: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  update: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  },
  remove: function (userId, doc, fields, modifier) {
    var u = Meteor.users.findOne({_id:userId});
    if (Roles.userIsInRole(u, ['admin'])) {
      return true;
    }
  }
});

if (Meteor.isServer) {
    Meteor.publish(null, function() {
            return Meteor.users.find({_id: this.userId}, {fields: {subscribed: 1}});
        });

  Meteor.publish('volumes', function () {
    return volumes.find({},{sort : {volume:-1}});
  });

  Meteor.publish('issues', function () {
    return issues.find({},{sort : {volume:1}});
  });

  Meteor.publish('subs', function () {
    return subs.find({});
  });

  Meteor.publish('issue', function (v,i) {
    return issues.find({'volume': parseInt(v), 'issue': parseInt(i)});
  });
  Meteor.publish('currentIssue',function(){
    return issues.find({},{sort : {volume:-1,issue:-1}});
  });

  Meteor.publish('articles', function () {
    return articles.find({},{sort : {volume:-1,issue:-1}});
  });
  Meteor.publish('articleInfo', function (mongoId) {
    return articles.find({'_id':mongoId},{});
  });
  /*TODO: RECENT define. By pub date?*/
  Meteor.publish('articlesRecentFive', function () {
    return articles.find({},{sort:{'_id':1},limit : 5});
  });
  Meteor.publish('feature', function () {
    return articles.find({'feature':true},{sort:{'_id':1}});
  });
  Meteor.publish('advance', function () {
    return articles.find({'advance':true},{sort:{'_id':1}});
  });

  //users
  Meteor.publish('allUsers', function(){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.users.find();
     }else{
      this.stop();
      return;
     }
  });

  Meteor.publish('userData', function(id){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.users.find({'_id':id});
     }else{
      this.stop();
      return;
     }
  });

  Meteor.publish('currentUser', function(id){
    if(!this.userId) return null;
    return Meteor.users.find(this.userId, {fields: {
      name_first: 1,
      name_last: 1,
    }});
  });
  Meteor.publish('users');

  //institutions
  Meteor.publish('institutions', function(){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return institutions.find();
     }else{
      this.stop();
      return;
     }
  });

  Meteor.publish('institution', function(id){
          if (Roles.userIsInRole(this.userId, ['admin'])) {
              return institutions.find({"_id":id});
          }else{
              this.stop();
              return;
          }
      });

  Meteor.publish('ipranges', function () {
          return ipranges.find({});
      });

  Meteor.publish('fullBoard', function () {
          return edboard.find({$or: [{role:"Impact Journals Director"}, {role:"Editorial Board"}]});
  });

  Meteor.publish('eic', function () {
          return edboard.find({role:"Editor-in-Chief"});
  });

  Meteor.publish('eb', function () {
          return edboard.find({role:"Founding Editorial Board"});
  });




  //AUTHORS
  Meteor.publish('authorsList', function(){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return authors.find();
     }else{
      this.stop();
      return;
     }
  });
  Meteor.publish('authorData', function(mongoId){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return  authors.find({'_id':mongoId})
     }else{
      this.stop();
      return;
     }
  });

  Meteor.publish('recommendations', function(){
    return recommendations.find({});
  });
  Meteor.publish('recommendationData',function(mongoId){
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      return  recommendations.find({'_id':mongoId})
    }else{
      this.stop();
      return;
    }
  })
}
if (Meteor.isClient) {
	//TODO: remove global subscribe to collections
	Meteor.subscribe('volumes');
//	 Meteor.subscribe('issues');
    Meteor.subscribe('ipranges')
    Meteor.subscribe('institutions')
    Meteor.subscribe('subs')
}
