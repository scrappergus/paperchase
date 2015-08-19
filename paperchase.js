if (Meteor.isClient) {

    Router.route('/', { 
            name: "home",
            layoutTemplate: 'Visitor'
        });


    Router.route('/archive', { 
            name: "archive",
            layoutTemplate: 'Visitor',
        });

    Router.route('/volume/:_volume/issue/:_issue', { 
            name: 'issue',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
                    Meteor.subscribe('issues'),
                    Meteor.subscribe('articles'),
                ]
            },
            data: function(){
                if(this.ready()){
                    var iss = this.params._issue;
                    var vol = parseInt(this.params._volume);
                    //get issue metadata
                    var issueData = issues.findOne({'issue': iss, 'volume': vol});
                    //get articles in issue
                    var issueArticles = articles.find({'issue_id':issueData._id},{sort : {page_start:1}}).fetch();
                    //test for start of article type
                    issueArticles = Meteor.organize.groupArticles(issueArticles);
                    issueData['articles'] = issueArticles;
                    // console.log(issueData);
                    return {
                        issue: issueData
                    };
                }
            }
        });

    Router.route('/article/:_id', { 
            name: 'Article',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
                    Meteor.subscribe('articles')
                ]
            },
            data: function(){
                if(this.ready()){
                    var id = this.params._id;
                    var article = articles.findOne({'_id': id});
                    // console.log('article = ');console.log(article);
                    return {
                        article: article
                    };
                }
            }
        });


    Router.route('/admin', {
            layoutTemplate: 'admin',
            template: 'archive'
        });


//    Router.route('/', {
//            name: 'home',
//            template: 'home'
//        });


}

if (Meteor.isServer) {
    Meteor.startup(function () {
            // code to run on server at startup
        });
}
