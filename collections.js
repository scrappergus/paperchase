volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
articles = new Mongo.Collection('articles');
articleTypes = new Mongo.Collection('articleTypes'); //when saving an article query this db and add the name, short_name and id as an object to the article
Institutions = new Mongo.Collection("institutions");
IPRanges = new Mongo.Collection("ipranges");
authors = new Mongo.Collection('authors');


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
Institutions.allow({
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
IPRanges.allow({
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
  Meteor.publish('volumes', function () {
    return volumes.find({},{sort : {volume:-1}});
  });
  Meteor.publish('issues', function () {
    return issues.find({},{sort : {volume:1}});
  });
  Meteor.publish('issue', function (v,i) {
    return issues.find({'volume': parseInt(v), 'issue': parseInt(i)});
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
  Meteor.publish('institutions', function(){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Institutions.find();
     }else{
      this.stop();
      return;
     }
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
}
if (Meteor.isClient) {
	//TODO: remove global subscribe to collections
	Meteor.subscribe('volumes');
	// Meteor.subscribe('issues');
}
