volumes = new Mongo.Collection('volumes');
issues = new Mongo.Collection('issues');
issuesDeleted = new Mongo.Collection('issues_deleted');
about = new Mongo.Collection('about');
articles = new Mongo.Collection('articles', {
    // transform: function(article) {
    // @TODO, move data processing here. readyData throws some errors and needs to be adjusted
    //     // console.log('---article',article._id);
    //     return Meteor.article.readyData(article);
    // }
});
institutions = new Mongo.Collection("institutions");
ipranges = new Mongo.Collection("ipranges");
edboard = new Mongo.Collection("edboard");
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
        var sectionsList,
            articlesList,
            articlesByMongoId;
        var journal = journalConfig.findOne();
        if(journal && f.name == 'advance' && journal.journal.short_name === 'oncotarget'){
            var sectionsIdOrder = [];
            var sectionsNameOrder = [];
            articlesList = articles.find({'_id':{'$in':order}}).fetch();
            articlesByMongoId = Meteor.organize.articlesByMongoId(articlesList);

            // order is now only used to determine section order, and articles are sorted by date
            // make sure that order has mongo IDs sorted by date
            order.forEach(function(mongoId){
                if (articlesByMongoId[mongoId]){
                    var article = articlesByMongoId[mongoId];
                    var sec = sections.findOne({'section_id' : article.section_id});
                    article.section_name = sec.section_name;
                    article.display_abstracts = sec.display_abstracts;

                    if (sectionsIdOrder.indexOf(article.section_id) === -1) {
                        sectionsIdOrder.push(article.section_id);
                        sectionsNameOrder.push(sec.section_name);
                    }
                }
            });

            var articleIdsByDate = Meteor.advance.sortAdvanceSectionsByDate(sectionsNameOrder, articlesList);
            if (articleIdsByDate) {
                f.articles = [];

                var last_section;

                for(var i = 0; i < articleIdsByDate.length; i++){
                    var article;
                    if (articlesByMongoId[articleIdsByDate[i]]){
                        article = articlesByMongoId[articleIdsByDate[i]];
                        // console.log(article._id);
                        if (article.section_id || article.section_id === 0) {
                            var section = sections.findOne({'section_id' : article.section_id});
                            if(section !== undefined && section.section_name) {
                                article.section_name = section.section_name;
                            } else if(section !== undefined && section.name) {
                                article.section_name = section.name;
                            }
                        } else if (article.article_type) {
                            article.section_name = article.article_type.name;
                        }

                        if (i===0) {
                            article.section_start = true;
                        } else if (last_section != article.section_name) {
                            article.section_start = true;
                        }

                        last_section = article.section_name;
                        f.articles.push(article);
                    }
                }
            }
        }
        else if(f.name == 'advance'){
            var unordered = articles.find({'_id':{'$in':order}}).fetch();
            f.ordered = Meteor.sorter.sort(unordered,order);
        }
        else if(f.name == 'ethics'){
            f.ordered = [];
            sectionsList = ethics.find({'_id':{'$in':order}}).fetch();
            // console.log(sectionsList);
            for(var i = 0 ; i < order.length ; i++){
                // console.log(order[i]);
                for(var a = 0 ; a < sectionsList.length ; a++){
                    // console.log(sectionsList[a]._id);
                    if(sectionsList[a]._id == order[i]){
                        f.ordered.push(sectionsList[a]);
                    }
                }
            }
        }
        else if(f.name == 'homePage'){
            f.ordered = [];
            sectionsList = homePage.find({'_id':{'$in':order}}).fetch();
            // console.log(sectionsList);
            for(var i = 0 ; i < order.length ; i++){
                // console.log(order[i]);
                for(var a = 0 ; a < sectionsList.length ; a++){
                    // console.log(sectionsList[a]._id);
                    if(sectionsList[a]._id == order[i]){
                        f.ordered.push(sectionsList[a]);
                    }
                }
            }
        }
        else if(f.name == 'forAuthors'){
            f.ordered = [];
            sectionsList = forAuthors.find({'_id':{'$in':order}}).fetch();
            // console.log(sectionsList);
            for(var i = 0 ; i < order.length ; i++){
                // console.log(order[i]);
                for(var a = 0 ; a < sectionsList.length ; a++){
                    // console.log(sectionsList[a]._id);
                    if(sectionsList[a]._id == order[i]){
                        f.ordered.push(sectionsList[a]);
                    }
                }
            }

        }
        else if(f.name == 'about'){
            // Same exact thing as forAuthors. Look into using collection name as a variable.
            f.ordered = [];
            sectionsList = about.find({'_id':{'$in':order}}).fetch();
            for(var i = 0 ; i < order.length ; i++){
              // console.log(order[i]);
                for(var a = 0 ; a < sectionsList.length ; a++){
                    // console.log(sectionsList[a]._id);
                    if(sectionsList[a]._id == order[i]){
                        f.ordered.push(sectionsList[a]);
                    }
                }
            }
        }
        else if(f.name == 'sections'){
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
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
    }
});
journalConfig.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
about.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
articles.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin','edit'],'article')) {
            return true;
        }
    },
    update: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin','edit'],'article')) {
            return true;
        }
    },
    remove: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin','edit'],'article')) {
            return true;
        }
    }
});
articleTypes.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
issues.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
issuesDeleted.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
    },
    update: function (userId, doc, fields, modifier) {
        return false;
    },
    remove: function (userId, doc, fields, modifier) {
        return false;
    }
});
volumes.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
edboard.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
forAuthors.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
          return true;
        }
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
newsList.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
          return true;
        }
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
authors.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
institutions.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
ipranges.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
sections.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
submissions.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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
homePage.allow({
    insert: function (userId, doc, fields, modifier) {
        var u = Meteor.users.findOne({_id:userId});
        if (Roles.userIsInRole(u, ['super-admin'])) {
            return true;
        }
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

// PUBLISH
if (Meteor.isServer) {

    Meteor.publish(null, function() {
        return Meteor.users.find({_id: this.userId}, {fields: {subscribed: 1}});
    });
    Meteor.publish(null, function (){
        return Meteor.roles.find({});
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
          'edboard_roles' : 1,
          'assets': 1,
          'assets_supplemental': 1,
          'assets_figures': 1,
          'visitor': 1,
          's3': 1,
          'api': 1,
          'elasticsearch': 1
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
        return issues.find({},{sort : {volume:-1,issue:1}},{volume:1,issue:1,pub_date:1});
    });
    // Meteor.publish('issue', function (volume,issue) {
    //     check(issue, String);
    //     return issues.find({volume: parseInt(volume), issue_linkable: issue});
    // });
    // Meteor.publish('issueArticles', function (volume,issue) {
    //     var issueinfo = issues.find({volume: parseInt(volume), issue_linkable: issue});
    //     return articles.find({issue_id : issueinfo._id});
    // });
    Meteor.publish('currentIssue',function(){
        return issues.find({current: true});
    });

    Meteor.publish('prevIssue',function(volumeAndIssue){
        var pieces,
            volumeData,
            issueData,
            issueIndex,
            prevIssueId;

        if(volumeAndIssue){
            pieces = Meteor.issue.urlPieces(volumeAndIssue);
            if(pieces && pieces.volume){
                volumeData = volumes.findOne({volume : parseInt(pieces.volume)});
                if(pieces.issue){
                    issueData = issues.findOne({volume : parseInt(pieces.volume), issue: pieces.issue});
                }
            }
        }

        if(volumeData && issueData){
            issueIndex = volumeData.issues.indexOf(issueData._id);
            if(issueIndex === 0){
                return []; // publish can only return cursor or an array of cursors
            }else{
                prevIssueId = volumeData.issues[parseInt(issueIndex - 1)];
                return issues.find({_id : prevIssueId});
            }
        }else{
            return [];
        }
    });
    Meteor.publish('nextIssue',function(volumeAndIssue){
        var pieces,
            volumeData,
            issueData,
            issueIndex,
            nextIssueId;

        if(volumeAndIssue){
            pieces = Meteor.issue.urlPieces(volumeAndIssue);
            if(pieces && pieces.volume){
                volumeData = volumes.findOne({volume : parseInt(pieces.volume)});
                if(pieces.issue){
                    issueData = issues.findOne({volume : parseInt(pieces.volume), issue: pieces.issue});
                }
            }
        }

        if(volumeData && issueData){
            issueIndex = volumeData.issues.indexOf(issueData._id);
            if(issueIndex === 0){
                return []; // publish can only return cursor or an array of cursors
            }else{
                nextIssueId = volumeData.issues[parseInt(issueIndex + 1)];
                return issues.find({_id : nextIssueId});
            }
        }else{
            return [];
        }
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
    Meteor.publish('articlesWithoutDates', function(){
        return articles.find({ $or: [ { 'dates.epub': {$exists: false} }, { 'history.accepted': {$exists: false}}, { 'history.received': {$exists: false}} ] });
    });
    Meteor.publish('submissionSet', function (queryType, queryParams) {
        var query = {};
        if(queryType && queryParams){
            if (queryType === 'issue'){
                query.find = {issue_id: queryParams};
            } else if (queryType === 'pii'){
                query.find = {'ids.pii':{'$in':queryParams}};
            }
            return articles.find(query.find, query.options);
        }else{
            this.ready();
        }
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
        var sorter,
            articlesList;
        sorter = sorters.findOne({'name':'advance'});
        if(sorter && sorter.order){
            return articles.find({'_id':{'$in':sorter.order}});
        }
        return articlesList;
    });
    Meteor.publish('submissions', function () {
        return submissions.find();
    });
    Meteor.publish('withoutIssueNotAdvance', function () {
        return articles.find({'issue_id':{$exists:false}, advance:false},{sort:{'_id':1}});
    });

    // Users
    // ----------------
    Meteor.publish('allUsers', function(){
        if (Roles.userIsInRole(this.userId, ['super-admin'])) {
            return Meteor.users.find();
        }else{
            this.ready();
            return;
        }
    });
    Meteor.publish('adminUsers', function(){
        if (Roles.userIsInRole(this.userId, ['super-admin'])) {
            return Meteor.users.find({'roles': {'$in': ['super-admin']}},{'name_first':1,'name_last':1});
        }else{
            this.ready();
            return;
        }
    });
    Meteor.publish('userData', function(id){
        check(id, String);
        if (Roles.userIsInRole(this.userId, ['super-admin'])) {
            return Meteor.users.find({_id:id});
        }else{
            this.ready();
            return;
        }
    });
    Meteor.publish('currentUser', function(id){
        check(id, String);
        if(!this.userId) return;
        return Meteor.users.find(this.userId, {fields: {
          name_first: 1,
          name_last: 1,
        }});
    });
    Meteor.publish('users',function(){
        return Meteor.users.find({},{services:0});
    });

    // Institutions
    // ----------------
    Meteor.publish('institutions', function(){
        if (Roles.userIsInRole(this.userId, ['super-admin'])) {
            return institutions.find();
        }else{
            this.stop();
            return;
        }
    });
    Meteor.publish('institution', function(id){
        check(id, String);
        if (Roles.userIsInRole(this.userId, ['super-admin'])) {
            return institutions.find({_id:id});
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
        check(mongoId, String);
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

    // Ethics
    // ------------
    Meteor.publish('ethics', function(){
        return ethics.find();
    });
    Meteor.publish('ethicsPublic', function(){
        return ethics.find({display:true});
    });

    // Home Page
    // ------------
    Meteor.publish('homePage', function(){
        return homePage.find();
    });
    Meteor.publish('homePagePublic', function(){
        return homePage.find({display:true});
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
            return authors.find({'_id':mongoId});
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
        check(mongoId, String);
        if (Roles.userIsInRole(this.userId, ['admin', 'super-admin'])) {
            return  recommendations.find({'_id':mongoId});
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
        check(mongoId, String);
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
        check(sectionMongoId, String);
        // For admin pages
        return articles.find({'section' : sectionMongoId});
    });
    Meteor.publish('sectionById', function(mongoId){
        check(mongoId, String);
        return sections.find({_id : mongoId});
    });
    Meteor.publish('sectionPapersByDashName', function(dashName){
        check(dashName, String);
        // console.log('..sectionPapersByDashName' +  dashName);
        var section = sections.findOne({'dash_name' : dashName});
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
    // Meteor.subscribe('volumes');
    //  Meteor.subscribe('issues');
    Meteor.subscribe('ipranges');
    Meteor.subscribe('institutions');
    Meteor.subscribe('subs');
    // Meteor.subscribe('journalConfig');
    Meteor.subscribe('articleTypes');
    Meteor.subscribe('sectionsVisible');
}
