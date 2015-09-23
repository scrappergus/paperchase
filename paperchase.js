// async loader for fonts
// https://github.com/typekit/webfontloader

if (Meteor.isClient) {

    WebFontConfig = {
        google: { families: [ 'Lora:400,400italic,700,700italic:latin' ] }
    };
    (function() {
            var wf = document.createElement('script');
            wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
            wf.type = 'text/javascript';
            wf.async = 'true';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(wf, s);
            console.log("async fonts loaded", WebFontConfig);
        })();

}

Router.configure({
    loadingTemplate: 'Loading'
});

institutionUpdateInsertHook = function(userId, doc, fieldNames, modifier, options) {
        var iprnew = [];
        var iprid = IPRanges.find({institutionID: doc._id});
        iprid.forEach(function(rec) {
                IPRanges.remove({_id: rec._id});
            });

        if(doc.IPRanges){
            doc.IPRanges.forEach(function(ipr) {
                    IPRanges.insert({
                            institutionID: doc._id
                            ,startIP: ipr.startIP
                            ,endIP: ipr.endIP
                            ,startNum: dot2num(ipr.startIP)
                            ,endNum: dot2num(ipr.endIP)
                        });
                });            
        }
    }

Institutions.after.insert(institutionUpdateInsertHook);
Institutions.after.update(institutionUpdateInsertHook);
Institutions.after.remove(function(userId, doc) {
        var iprid = IPRanges.find({institutionID: doc._id});
        iprid.forEach(function(rec) {
                IPRanges.remove({_id: rec._id});
            });
});

if (Meteor.isClient) {
    Template.registerHelper('clientIP', function() {
            return headers.getClientIP();
        });

    Template.registerHelper('isSubscribedIP', function() {
            ip = dot2num(headers.getClientIP());

            var match = IPRanges.findOne( { 
                    startNum: {$lte: ip} 
                    ,endNum: {$gte: ip}
                }
            );

            return match !== undefined;
        });

    Template.registerHelper('getInstitutionByIP', function() {
            ip = dot2num(headers.getClientIP());

            var match = IPRanges.findOne( { 
                    startNum: {$lte: ip} 
                    ,endNum: {$gte: ip}
                }
            );

            if(match) {
               inst_match = Institutions.findOne({
                       "_id": match.institutionID
                   });
            }

            return inst_match || false;
        });


    Template.AdminInstitution.helpers({
            'institutions': function() {
                return Institutions.find({});
            }
        });

    Template.AdminInstitutionEdit.helpers({
            'institution': function() {
                return Institutions.findOne({_id:this._id});
            }
        });

    Session.setDefault('formMethod','');
    Session.setDefault('fileNameXML',''); //LIVE
    Session.setDefault('submission_list',null);
    Session.setDefault('error',false);
    // Session.setDefault('fileNameXML','PMC2815766.xml'); //LOCAL TESTING

    Router.route('/', { 
        name: 'home',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            return[
                Meteor.subscribe('feature')
            ]
        },        
        data: function(){
            var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
            return {
                feature : featureList
            }
        }
    });


    Router.route('/advance', { 
        name: 'advance',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            return[
                Meteor.subscribe('advance')
            ]
        },        
        data: function(){
            var advanceList = articles.find({'advance':true},{sort:{'_id':1}}).fetch();
            return {
                advance : advanceList
            }
        }
    });

    Router.route('/archive', { 
        name: 'archive',
        layoutTemplate: 'Visitor',
    });

    Router.route('/issue/:vi', { 
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
                    var vi = this.params.vi;
                    var matches = vi.match('v([0-9]+)i([0-9]+)');
                    var volume = parseInt(matches[1]);
                    var issue = parseInt(matches[2]);
                    //get issue metadata
                    var issueData = issues.findOne({'issue': issue, 'volume': volume});

                    var issueArticles = Meteor.organize.getIssueArticlesByID(issueData['_id']);
                    //get articles in issue
                    //test for start of article type
                    
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
                Meteor.subscribe('articleInfo',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                var article;
                article = articles.findOne({'_id': id});
                return {
                    article: article
                };   
            }
        }
    });
    Router.route('/article/:_id/text', { 
        name: 'ArticleText',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id)
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

	/*
	ADMIN PAGES
	*/
    Router.route('/admin', {
        name: 'admin.dashboard',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('articlesRecentFive')
            ]
        },
        data: function(){
            if(this.ready()){
                var articlesList = articles.find({}).fetch();
                return {
                    articles: articlesList
                };
            }
        }
    });

    /*data submissions*/
    Router.route('/admin/data_submissions',{
        name: 'AdminDataSubmissions',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('issues'),
                Meteor.subscribe('volumes')
            ]
        },
    });

    /*xml intake*/
    Router.route('/admin/article_xml',{
        name: 'adminArticleXmlIntake',
        layoutTemplate: 'Admin'
    });
    Router.route('/admin/article-xml/process',{
        name: 'adminArticleXmlProcess',
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
           var fileNameXML = Session.get('fileNameXML');
           if(fileNameXML === ''){
                Router.go('adminArticleXmlIntake');
           }else{
                this.next();
           }
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articles'),
                Meteor.subscribe('issues')
            ]
        },
        data: function(){
            var fileName = Session.get('fileNameXML');
            var newArticle;
            newArticle =  ReactiveMethod.call('processXML',fileName);
            if(newArticle){
                //add issue_id if exists, 
                //later when INSERT into articles, check for if issue_id in doc (in meteor method addArticle)
                var articleIssue = issues.findOne({'volume' : newArticle['volume'], 'issue': newArticle['issue']});
                if(articleIssue){
                    newArticle['issue_id'] = articleIssue['_id'];
                }

                //TODO: better way of checking if article exists, title could change during production.
                var articleExists = articles.findOne({'title' : newArticle['title']});
                return {
                    article: newArticle,
                    articleExists: articleExists
                }            
            }
        }
    });

    /*article and articles*/
    Router.route('/admin/articles',{
        name: 'adminArticlesDashboard',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('feature'),
                Meteor.subscribe('advance'),
            ]
        },        
        data: function(){
            var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
            var advanceList = articles.find({'advance':true},{sort:{'_id':1}}).fetch();
            return {
                feature : featureList,
                advance : advanceList,
            }
        }
    });
    Router.route('/admin/articles/list',{
        name: 'adminArticlesList',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('articles')
            ]
        },        
        data: function(){
            return {
                articles : articles.find().fetch()
            }
        }
    });    
    Router.route('/admin/article/:_id',{
        name: 'adminArticle',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id)
            ]
        },        
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                var article = articles.findOne({'_id': id});
                var feature = '';
                var advance = '';
                // console.log('article = ');console.log(article);
                if(article.feature){
                    feature = 'checked';
                }
                if(article.advance){
                    advance = 'checked';
                }
                return {
                    article: article,
                    feature: feature,
                    advance: advance
                };
            }
        }
    })

    /*archive browsing*/
    Router.route('/admin/archive', {
            name: 'adminArchive'
            ,layoutTemplate: 'Admin'
        });


    /*issue control*/
    //TODO: LIMIT subscription of articles to just issue
    Router.route('/admin/issue/:vi', {
        name: 'admin.issue',
        layoutTemplate: 'Admin',
        waitOn: function(){
            var vi = this.params.vi;
            var matches = vi.match('v([0-9]+)i([0-9]+)');
            var volume = parseInt(matches[1]);
            var issue = parseInt(matches[2]);
            return[
                Meteor.subscribe('articles'),
                Meteor.subscribe('issue',volume,issue)
            ]
        },
        data: function(){
            if(this.ready()){
                var vi = this.params.vi;
                var matches = vi.match('v([0-9]+)i([0-9]+)');
                var volume = parseInt(matches[1]);
                var issue = parseInt(matches[2]);
                var issueData = issues.findOne({'volume' : parseInt(volume), 'issue':issue});
                var issueArticles = Meteor.organize.getIssueArticlesByID(issueData['_id']);
                issueData['articles'] = issueArticles;
                var data = {
                    issue: issueData
                };
                //do not change issue variable name in data, we need this to get mongoid to update the doc
                return data;
            }
        }
    });



    /*users*/
    Router.route('/admin/users', {
    	name: 'AdminUsers',
    	layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('allUsers')
			]
		},
		data: function(){
			if(this.ready()){
				var users = Meteor.users.find().fetch();
				return {
					users: users
				};
			}
		}
	});
    Router.route('/admin/user/:_id', {
    	name: 'AdminUser',
    	layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('userData',this.params._id)
			]
		},
		data: function(){
			if(this.ready()){
                var id = this.params._id;
				var u = Meteor.users.findOne({'_id':id});
				//user permissions
				u['adminRole'] = '';
				u['superRole'] = '';
				u['articlesRole'] = '';
				var r = u.roles;
				var rL = r.length;
				for(var i = 0 ; i < rL ; i++){
					u[r[i]+'Role'] = 'checked';
				}
				return {
					u: u
				};
			}
		}
	});
    Router.route('/admin/adduser', {
    	name: 'AdminAddUser',
    	layoutTemplate: 'Admin'
	});


    Router.route('/admin/authors', {
        name: 'AdminAuthors',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('authorsList'),
            ]
        },
        data: function(){
            if(this.ready()){
                var authorsList = authors.find().fetch();
                return {
                    authors : authorsList
                };
            }
        }
    });
    //TODO AdminAuthors: limit articles subscription 
    Router.route('/admin/author/:_id', {
        name: 'AdminAuthor',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('articles'),
                Meteor.subscribe('authorData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var mongoId = this.params._id;
                var authorsData = authors.findOne({'_id':mongoId});
                var authorArticlesList = articles.find({ 'authors' : { '$elemMatch' : { 'ids.mongo_id' :  mongoId } } });
                return {
                    author : authorsData,
                    articles: authorArticlesList
                };
            }
        }
    });

    Router.route('/admin/institution', {
            name: 'admin.institution'
            ,layoutTemplate: 'Admin'
        });

    Router.route('/admin/institution/add', {
        layoutTemplate: 'Admin',
        name: 'AdminInstitutionAdd',
        waitOn: function(){
        },
        data: function(){
            Session.set('formType','insert');
        }
    });    

    Router.route('/admin/institution/edit/:_id', {
        layoutTemplate: 'Admin',
        name: 'AdminInstitutionEdit',
        waitOn: function(){
            return[
                Meteor.subscribe('institutions',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                var institution = Institutions.findOne({'_id':id});
                // console.log(institution);
                Session.set('formType','update');
                return institution;
            }
        }
    });   


    //this route is used to query pmc for all xml.. don't go here.
    Router.route('/admin/batch_process', {
        name: 'AdminBatchXml',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('articles')
            ]
        },
    }); 
}
// Router.route('/xml/:_filename',{
//     name: 'xml',
//     where: 'server',
//     data: function(){
//         Meteor.call('getXML',this.params._filename,function(e,xml){
//             if(e){
//                 console.log('error');
//                 console.log(e);
//             }else{
//                 // xml;
//                 // console.log(xml);
//                 return xml;
//             }
//         });
//     },
//     action: function(r) {
//         if (this.ready()) {
//             console.log(this.params._filename);
//             // console.log(r);
//             console.log(this);
//             var headers = {'Content-type': 'application/xml', 'charset' : 'ISO-8859-1'};
//             this.response.writeHead(200, headers);
//             this.response.end('<xml></xml>');         
//         }           
//     }
// });   
if (Meteor.isServer) {
    Meteor.startup(function () {
 
    });
}

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function dot2num(dot) {
    var d = dot.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);}

function num2dot(num) {
    var d = num%256;
    for (var i = 3; i > 0; i--) { 
        num = Math.floor(num/256);
        d = num%256 + '.' + d;}
    return d;}
