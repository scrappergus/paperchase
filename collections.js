volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
about = new Mongo.Collection('about');
articles = new Mongo.Collection('articles');
institutions = new Mongo.Collection("institutions");
ipranges = new Mongo.Collection("ipranges");
edboard = new Mongo.Collection("edboard");
forAuthors = new Mongo.Collection('for_authors');
authors = new Mongo.Collection('authors');
newsList = new Mongo.Collection('news');
recommendations = new Mongo.Collection('recommendations');
subs = new Mongo.Collection('subscriptions');
submissions = new Mongo.Collection('submissions');
journalConfig = new Mongo.Collection('config');
contact = new Mongo.Collection('contact');
articleTypes = new Mongo.Collection('article_types');
sections = new Mongo.Collection('sections');
// Files
// -------
xmlCollection = new Mongo.Collection('xml');
pdfCollection = new Mongo.Collection('pdf');
figCollection = new Mongo.Collection('figures');
// Sorters
// -------
sorters = new Mongo.Collection('sorters', {
  transform: function(f) {
      var order = f.order;
      // console.log(order);
      // TODO: collection name as variable?? can we consolidate this code to not use else if? we are using pretty much the same logic to order collections
      if(f.name == 'advance'){
        var articlesList = articles.find({'_id':{'$in':order}}).fetch();
        f.articles = [];
        for(var i = 0 ; i < order.length ; i++){
          for(var a = 0 ; a < articlesList.length ; a++){
            if(articlesList[a]['_id'] === order[i]){
              var section = sections.findOne({'section_id' : articlesList[a]['section_id']});
              if(section !== undefined) {
                  articlesList[a]['section_name'] = section['section_name'];
              }
              f.articles.push(articlesList[a]);
            }
          }
        }
      }else if(f.name == 'forAuthors'){
        f.ordered = [];
        var sectionsList = forAuthors.find({'_id':{'$in':order}}).fetch();
        // console.log(sectionsList);
        for(var i = 0 ; i < order.length ; i++){
          // console.log(order[i]);
          for(var a = 0 ; a < sectionsList.length ; a++){
            // console.log(sectionsList[a]['_id']);
            if(sectionsList[a]['_id'] == order[i]){
              f.ordered.push(sectionsList[a]);
            }
          }
        }
      }else if(f.name == 'about'){
        // Same exact thing as forAuthors. Look into using collection name as a variable.
        f.ordered = [];
        var sectionsList = about.find({'_id':{'$in':order}}).fetch();
        for(var i = 0 ; i < order.length ; i++){
          // console.log(order[i]);
          for(var a = 0 ; a < sectionsList.length ; a++){
            // console.log(sectionsList[a]['_id']);
            if(sectionsList[a]['_id'] == order[i]){
              f.ordered.push(sectionsList[a]);
            }
          }
        }
      }else if(f.name == 'sections'){
        var unordered = sections.find({'_id':{'$in':order}}).fetch();
        f.ordered = Meteor.sorter.sort(unordered,order);
      }

      return f;
  }
});
publish = new Mongo.Collection('publish');

// ALLOW
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
journalConfig.allow({
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
about.allow({
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
edboard.allow({
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
forAuthors.allow({
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
newsList.allow({
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
sections.allow({
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
submissions.allow({
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
sorters.allow({
  insert: function () {
      return true;
  },
  update: function () {
      return true;
  },
  remove: function () {
      return true;
  }
});


// PUBLISH
if (Meteor.isServer) {
  Meteor.publish(null, function() {
    return Meteor.users.find({_id: this.userId}, {fields: {subscribed: 1}});
  });

  Meteor.publish('subs', function () {
    return subs.find({});
  });
  Meteor.publish('journalConfig', function() {
    var siteConfig =  journalConfig.find({},{fields: {
      'journal' : 1,
      'site' : 1,
      'submission.url' : 1,
      'contact' : 1,
      'edboard_roles' : 1
    }});
    return siteConfig;
  });
  Meteor.publish('sorters', function() {
    return sorters.find();
  });
  Meteor.publish('sortedList', function(listName) {
    return sorters.find({'name' : listName});
  });
  Meteor.publish('contact', function() {
    return contact.find();
  });

  Meteor.publish('volumes', function () {
    return volumes.find({},{sort : {volume:-1}});
  });

  // Issue
  // ------
  Meteor.publish('issues', function () {
    return issues.find({},{sort : {volume:-1,issue:1}},{volume:1,issue:1,pub_date:1});
  });
  Meteor.publish('issue', function (volume,issue) {
    return issues.find({volume: parseInt(volume), issue: parseInt(issue)});
  });
  Meteor.publish('issueArticles', function (volume,issue) {
    return articles.find({volume: parseInt(volume), issue: parseInt(issue)});
  });
  Meteor.publish('currentIssue',function(){
    return issues.find({},{sort : {volume:-1,issue:-1}});
  });

  // Articles
  // ---------
  Meteor.publish('articles', function () {
    return articles.find({},{sort : {volume:-1,issue:-1}});
  });
  Meteor.publish('articleInfo', function(id) {
    // console.log('articleInfo - ' + id);
    var article = articles.findOne({'_id':id},{});
    // URL is based on Mongo ID. But a user could put PII instead, if so send PII info to redirect
    if(article){
      return articles.find({'_id':id},{});
    }else{
      return  articles.find({'ids.pii':id},{});
    }
  });
  Meteor.publish('submission-set', function (queryType, queryParams) {
    var articlesList;
    if(queryType === 'issue'){
      articlesList = articles.find({'issue_id': queryParams});
    }else if(queryType === 'pii'){
      articlesList = articles.find({'_id':{'$in':queryParams}});
    }

    // if a user wants to change the submissions list and start over,
    // to clear the collection we just pass a queryType that is neither issue nor pii and undefined will be returned

    return articlesList;
  });
  /*TODO: RECENT define. By pub date?*/
  Meteor.publish('articlesRecentFive', function () {
    return articles.find({},{sort:{'_id':1},limit : 5});
  });
  Meteor.publish('articleTypes', function () {
    return articleTypes.find({},{});
  });
  Meteor.publish('feature', function () {
    return articles.find({'feature':true},{sort:{'_id':1}});
  });
  Meteor.publish('advance', function () {
    var articlesList = articles.find({advance : true});
    return articlesList;
  });
  Meteor.publish('submissions', function () {
    return submissions.find();
  });

  // Users
  // ----------------
  Meteor.publish('allUsers', function(){
     if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.users.find();
     }else{
      this.stop();
      return;
     }
  });
  Meteor.publish('adminUsers', function(){
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.users.find({'roles': {'$in': ['admin']}},{'name_first':1,'name_last':1});
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
    if(!this.userId) return;
    return Meteor.users.find(this.userId, {fields: {
      name_first: 1,
      name_last: 1,
    }});
  });
  Meteor.publish('users',function(){
    return Meteor.users.find();
  });

  // Institutions
  // ----------------
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


  // Editorial Board
  // ---------------
  Meteor.publish('fullBoard', function () {
    return edboard.find({'role': {'$in': ['Editorial Board']}});
    // return edboard.find({$or: [{role:"Impact Journals Director"}, {role:"Editorial Board"}]});
  });
  Meteor.publish('entireBoard', function () {
    return edboard.find();
    // return edboard.find({$or: [{role:"Impact Journals Director"}, {role:"Editorial Board"}]});
  });
  Meteor.publish('eic', function () {
    return edboard.find({'role': {'$in': ['Editor-in-Chief']}});
  });
  Meteor.publish('eb', function () {
    return edboard.find({'role': {'$in': ['Founding Editorial Board']}});
  });
  Meteor.publish('edBoardMember', function (mongoId) {
    return edboard.find({_id: mongoId});
  });

  // About
  // ------------
  Meteor.publish('about', function(){
    return about.find();
  });
  Meteor.publish('aboutPublic', function(){
    return about.find({display:true});
  });

  // For Authors
  // ------------
  Meteor.publish('forAuthors', function(){
    return forAuthors.find();
  });
  Meteor.publish('forAuthorsPublic', function(){
    return forAuthors.find({display:true});
  });


  // Authors
  // ----------------
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

  // Recommendations
  // ----------------
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
});

  // News
  // ----------------
  Meteor.publish('newsListAll', function(){
    return newsList.find();
  });
  Meteor.publish('newsListDisplay', function(){
    return newsList.find({display: true});
  });
  Meteor.publish('newsItem', function(mongoId){
    return newsList.find({_id:mongoId});
  });


  // Sections
  // ----------------
   Meteor.publish('sections', function() {
     return sections.find();
   });
  Meteor.publish('sectionsAll', function(){
    // For admin pages
    return sections.find({});
  });
  Meteor.publish('sectionsVisible', function(){
    // For admin pages
    return sections.find({display: true});
  });
  Meteor.publish('sectionPapers', function(sectionMongoId){
    // For admin pages
    return articles.find({'section' : sectionMongoId});
  });
  Meteor.publish('sectionPapersByDashName', function(dashName){
    // console.log('..sectionPapersByDashName' +  dashName);
    var section = sections.findOne({'dash_name' : dashName})
    return articles.find({'section' : section._id});
  });


  // For advance
  Meteor.publish('publish', function () {
          return publish.find({name:'advance'}, {'limit': 1, sort: {'pubtime':-1}});
    });
}

// SUBSCRIBE
if (Meteor.isClient) {
	//TODO: remove global subscribe to collections
	// Meteor.subscribe('volumes');
	//  Meteor.subscribe('issues');
    Meteor.subscribe('ipranges');
    Meteor.subscribe('institutions');
    Meteor.subscribe('subs');
    // Meteor.subscribe('journalConfig');
    Meteor.subscribe('articleTypes');
    Meteor.subscribe('sectionsVisible');
}
