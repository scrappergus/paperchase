volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
issuesDeleted = new Mongo.Collection('issues_deleted');
about = new Mongo.Collection('about');
articles = new Mongo.Collection('articles');
institutions = new Mongo.Collection('institutions');
ipranges = new Mongo.Collection('ipranges');
edboard = new Mongo.Collection('edboard');
forAuthors = new Mongo.Collection('for_authors');
ethics = new Mongo.Collection('ethics');
homePage = new Mongo.Collection('homePage');
authors = new Mongo.Collection('authors');
newsList = new Mongo.Collection('news');
recommendations = new Mongo.Collection('recommendations');
subs = new Mongo.Collection('subscriptions');
submissions = new Mongo.Collection('submissions');
journalConfig = new Mongo.Collection('config');
contact = new Mongo.Collection('contact');
articleTypes = new Mongo.Collection('article_types');
sections = new Mongo.Collection('sections');
// Sorters
// -------
sorters = new Mongo.Collection('sorters', {
    transform: function(f) {
    var order = f.order;
    if(f.name == 'advance'){
        var unordered,
            ordered;
        unordered = articles.find({'_id':{'$in':order}}).fetch();
        ordered = Meteor.sorter.sort(unordered,order);
        ordered = Meteor.organize.groupArticles(ordered);
        f.ordered = ordered;
    }else if(f.name == 'ethics'){
        f.ordered = [];
        var sectionsList = ethics.find({'_id':{'$in':order}}).fetch();
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
    }else if(f.name == 'homePage'){
        f.ordered = [];
        var sectionsList = homePage.find({'_id':{'$in':order}}).fetch();
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
// ---------
// Not creating visitor user accounts yet
// Meteor.users.allow({
//     update: function (userId, doc, fields, modifier) {
//         if (userId && doc._id === userId) {
//             // user can modify own
//             return true;
//         }
//         // admin can modify any
//         var u = Meteor.users.findOne({_id:userId});
//         if (Roles.userIsInRole(u, ['super-admin'])) {
//             return true;
//         }
//     }
// });
recommendations.allow({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
    },
    remove: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
    }
});

// DENY
// ---------
// Not creating visitor user accounts yet
Meteor.users.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return false;
    },
    remove: function (userId, doc, fields, modifier) {
        return false;
    }
});
journalConfig.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
about.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
articles.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
articleTypes.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
issues.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
issuesDeleted.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return false;
    },
    remove: function (userId, doc, fields, modifier) {
        return false;
    }
});
volumes.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
edboard.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
forAuthors.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
newsList.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
authors.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
institutions.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
ipranges.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
sections.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
submissions.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});
sorters.deny({
    insert: function (userId, doc, fields, modifier) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc, fields, modifier) {
        return true;
    }
});


// PUBLISH
if (Meteor.isServer) {

    // Not creating visitor user accounts yet
    // Meteor.publish(null, function() {
    //     return Meteor.users.find({_id: this.userId}, {fields: {subscribed: 1}});
    // });
    // Meteor.publish('subs', function () {
    //     return subs.find({});
    // });

    Meteor.publish(null, function (){
        return Meteor.roles.find({})
    });
    Meteor.publish('journalConfig', function() {
        var siteConfig =  journalConfig.find({},{fields: {
          'journal' : 1,
          'site' : 1,
          'submission.url' : 1,
          'contact' : 1,
          'edboard_roles' : 1,
          'assets': 1,
          'assets_figures': 1,
          'assets_supplemental': 1,
          'social': 1,
          'cloudfront': 1
        }});
        return siteConfig;
    });
    Meteor.publish('sorters', function() {
        return sorters.find();
    });
    Meteor.publish('sortedList', function(listName) {
        check(listName, String);
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
        return issues.find({display : true},{sort : {volume:-1,issue:1}},{volume:1,issue:1,pub_date:1});
    });
    Meteor.publish('currentIssue',function(){
        return issues.find({current: true});
    });

    Meteor.publish('issueByVolNum',function(vol, num){
        return issues.find({volume:vol, issue:num});
    });

    Meteor.publish('articleIssue',function(articleMongoId){
        // console.log('articleMongoId', articleMongoId);
        // for getting issue information for article
        check(articleMongoId, String);
        var articleInfo = articles.findOne({_id : articleMongoId});
        var issueInfo;
        if(articleInfo && articleInfo.issue_id){
          issueInfo = issues.find({_id : articleInfo.issue_id});
        }
        // console.log('articleInfo',articleInfo.issue_id);
        if(issueInfo){
          return issueInfo;
        }else{
          return [];
        }
    });

    // Articles
    // ---------
    Meteor.publish('articles', function () {
        return articles.find({},{sort : {volume:-1,issue:-1}});
    });
    Meteor.publish('articleInfo', function(id) {
        check(id, String);
        var article = articles.findOne({'_id':id},{});
        // URL is based on Mongo ID. But a user could put PII instead, if so send PII info to redirect
        if(article){
          return articles.find({'_id':id},{});
        }else if(articles.findOne({'ids.pii':id},{})){
          return articles.find({'ids.pii':id},{});
        }else{
          return [];
        }
    });
    Meteor.publish('articleByPii', function(pii) {
        check(pii, String);
        return articles.find({'ids.pii':pii},{});
    });

    Meteor.publish('articleByVolumePage', function(volume, page_start) {
        check(volume, Number);
        check(page_start, Number);
        return articles.find({volume:volume, page_start:page_start});
    });


    Meteor.publish('articlesWithoutDates', function(){
        return articles.find({ $or: [ { 'dates.epub': {$exists: false} }, { 'history.accepted': {$exists: false}}, { 'history.received': {$exists: false}} ] });
    });
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
        var sorter = sorters.findOne({'name':'advance'});
        var articlesList = articles.find({'_id':{'$in':sorter.order}});

        return articlesList;
    });
    Meteor.publish('aop', function () {
        return articles.find({'issue_id':{$exists:false}},{sort:{'_id':1}});
    });


    // Not creating visitor user accounts yet
    // Users
    // ----------------
    // Meteor.publish('userData', function(id){
    //     check(id, String);
    //     if (Roles.userIsInRole(this.userId, ['super-admin'])) {
    //         return Meteor.users.find({_id:id});
    //     }else{
    //         this.stop();
    //         return;
    //     }
    // });
    // Meteor.publish('currentUser', function(id){
    //     check(id, String);
    //     if(!this.userId) return;
    //     return Meteor.users.find(this.userId, {fields: {
    //       name_first: 1,
    //       name_last: 1,
    //     }});
    // });

    // Institutions
    // ----------------
    // Meteor.publish('institution', function(id){
    //     check(id, String);
    //     if (Roles.userIsInRole(this.userId, ['super-admin'])) {
    //         return institutions.find({_id:id});
    //     }else{
    //         this.stop();
    //         return;
    //     }
    // });

    // Meteor.publish('ipranges', function () {
    //     return ipranges.find({});
    // });


    // Editorial Board
    // ---------------
    Meteor.publish('fullBoard', function () {
        return edboard.find({'role': {'$in': ['Editorial Board']}});
    });
    Meteor.publish('entireBoard', function () {
        return edboard.find();
    });
    Meteor.publish('eic', function () {
        return edboard.find({'role': {'$in': ['Editor-in-Chief']}});
    });
    Meteor.publish('eb', function () {
        return edboard.find({'role': {'$in': ['Founding Editorial Board']}});
    });
    Meteor.publish('edBoardMember', function (mongoId) {
        check(mongoId, String);
        return edboard.find({_id: mongoId});
    });

    // About
    // ------------
    Meteor.publish('aboutPublic', function(){
        return about.find({display:true});
    });

    // Ethics
    // ------------
    Meteor.publish('ethicsPublic', function(){
        return ethics.find({display:true});
    });

    // Home Page
    // ------------
    Meteor.publish('homePagePublic', function(){
        return homePage.find({display:true});
    });

    // For Authors
    // ------------
    Meteor.publish('forAuthorsPublic', function(){
        return forAuthors.find({display:true});
    });


    // Authors
    // ----------------
    Meteor.publish('authorsList', function(){
        if (Roles.userIsInRole(this.userId, ['admin', 'super-admin'])) {
            return authors.find();
        }else{
            this.stop();
            return;
        }

    });
    Meteor.publish('authorData', function(mongoId){
        check(mongoId, String);
        if (Roles.userIsInRole(this.userId, ['admin', 'super-admin'])) {
            return authors.find({'_id':mongoId})
        }else{
            this.stop();
            return;
        }
    });


    // News
    // ----------------
    Meteor.publish('newsListDisplay', function(){
        return newsList.find({display: true, interview: false});
    });
    Meteor.publish('newsItem', function(mongoId){
        check(mongoId, String);
        return newsList.find({_id:mongoId});
    });
    Meteor.publish('mostRecentInterview', function(){
        return newsList.find({display: true, interview: true});
    });
    Meteor.publish('interviews', function(){
        return newsList.find({display: true, interview: true});
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
        check(sectionMongoId, String);
        // For admin pages
        return articles.find({'section' : sectionMongoId});
    });
    Meteor.publish('sectionById', function(mongoId){
        check(mongoId, String);
        return sections.findOne({_id : mongoId})
    });
    Meteor.publish('sectionPapersByDashName', function(dashName){
        check(dashName, String);
        // console.log('..sectionPapersByDashName' +  dashName);
        var section = sections.findOne({'dash_name' : dashName})
        return articles.find({'section' : section._id});
    });


    // For advance
    // ----------------
    Meteor.publish('publish', function () {
        return publish.find({name:'advance'}, {'limit': 1, sort: {'pubtime':-1}});
    });

    // Search
    // ----------------
    Meteor.publish('search', function(searchValue) {
        if (!searchValue) {
            return articles.find({});
        }
        return articles.find(
            { $text: {$search: searchValue} },
            {
                // `fields` is where we can add MongoDB projections. Here we're causing
                // each document published to include a property named `score`, which
                // contains the document's search rank, a numerical value, with more
                // relevant documents having a higher score.
                fields: {
                    score: { $meta: "textScore" }
                },
                // This indicates that we wish the publication to be sorted by the
                // `score` property specified in the projection fields above.
                sort: {
                    score: { $meta: "textScore" }
                }
            }
        );
    });
}

// SUBSCRIBE
if (Meteor.isClient) {
    // Meteor.subscribe('ipranges');
    // Meteor.subscribe('institutions');
    Meteor.subscribe('articleTypes');
    Meteor.subscribe('sectionsVisible');

    // Not creating visitor user accounts yet
    // Meteor.subscribe('subs');
}
