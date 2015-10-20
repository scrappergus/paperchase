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
			//console.log("async fonts loaded", WebFontConfig);
	})();
}

Router.configure({
	loadingTemplate: 'Loading'
});


institutionUpdateInsertHook = function(userId, doc, fieldNames, modifier, options) {
    var iprnew = [];
    var iprid = ipranges.find({institutionID: doc._id});
    iprid.forEach(function(rec) {
            ipranges.remove({_id: rec._id});
        });


    if(doc.IPRanges){
        doc.IPRanges.forEach(function(ipr) {
                ipranges.insert({
                        institutionID: doc._id
                        ,startIP: ipr.startIP
                        ,endIP: ipr.endIP
                        ,startNum: dot2num(ipr.startIP)
                        ,endNum: dot2num(ipr.endIP)
                    });
            });
    }
}

institutions.after.insert(institutionUpdateInsertHook);
institutions.after.update(institutionUpdateInsertHook);
institutions.after.remove(function(userId, doc) {
	var iprid = ipranges.find({institutionID: doc._id});
	iprid.forEach(function(rec) {
		ipranges.remove({_id: rec._id});
	});
});


//DOWNLOAD ROUTES
Router.route('/pdf/:_filename',{
    where: 'server',
    action: function(){
        var name = this.params._filename;
        var filePath = process.env.PWD + '/uploads/pdf/' + name;
        var fs = Meteor.npmRequire('fs');
        var data = fs.readFileSync(filePath);
        this.response.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=' + name
        });
        this.response.write(data);
        this.response.end();
    }
});
Router.route('/xml-cite-set/:_filename',{
    where: 'server',
    action: function(){
        var name = this.params._filename;
        var filePath = process.env.PWD + '/xml-sets/' + name;
        // console.log(filePath);
        var fs = Meteor.npmRequire('fs');
        var data = fs.readFileSync(filePath);
        var headers = {'Content-type': 'application/xml','Content-Disposition': 'attachment'};
        this.response.writeHead(200, headers);
        this.response.write(data);
        this.response.end();
    }
});


if (Meteor.isClient) {




    Session.setDefault('formMethod','');
    Session.setDefault('fileNameXML',''); //LIVE
    Session.setDefault('error',false);
    Session.setDefault('errorMessages',null);
    Session.setDefault('articleData',null);
    Session.setDefault('article',null);
    Session.setDefault('article-id',null);
    Session.setDefault('affIndex',null);
    Session.setDefault('missingPii',null);
    Session.setDefault('preprocess-article',false);
    // Session.setDefault('fileNameXML','PMC2815766.xml'); //LOCAL TESTING

    Router.route('/', {
            name: 'Home',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
                Meteor.subscribe('feature'),
                Meteor.subscribe('eic'),
                Meteor.subscribe('eb')
                ]
            },
            data: function(){
                var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
                return {
                    feature : featureList,
                    eic:edboard.find({role:"Editor-in-Chief"}) ,
                    eb:edboard.find({role:"Founding Editorial Board"})
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


    Router.route('/account', {
            name: 'Account',
            layoutTemplate: 'Visitor',
        });


    Router.route('/archive', {
            name: 'Archive',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
	                Meteor.subscribe('volumes'),
	                Meteor.subscribe('issues'),
	                Meteor.subscribe('articles'),
                ]
            }
        });

    Router.route('/editorial-board', {
            name: 'EdBoard',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
                Meteor.subscribe('eic'),
                Meteor.subscribe('fullBoard')
                ]
            },
            data: function(){
                return {
                    eic:edboard.find({role:"Editor-in-Chief"}),
                    fullBoard:edboard.find({$or: [{role:"Founding Editorial Board"}, {role:"Editorial Board"}]})
                }
            }
        });



    Router.route('/for-authors', {
            name: 'ForAuthors',
            layoutTemplate: 'Visitor'
        });

    Router.route('/about', {
            name: 'About',
            layoutTemplate: 'Visitor'
        });

    Router.route('/contact', {
            name: 'Contact',
            layoutTemplate: 'Visitor'
        });

    Router.route('/recent-breakthroughs', {
            name: 'RecentBreakthroughs',
            layoutTemplate: 'Visitor'
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

    Router.route('/recommend', {
        name: 'Recommend',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            Meteor.subscribe('currentUser');
        },
        data: function(){
            if(Meteor.user()){
                var u =  Meteor.users.findOne();
                return {
                    user: u
                }
            }
        }
    });


    Router.route('/subscribe', {
        name: 'Subscribe',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            return[
            Meteor.subscribe('currentIssue')
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    issue: issues.findOne(),
                    today: new Date(),
                    nextYear: new Date(new Date().setYear(new Date().getFullYear() + 1))
                }
            }
        }
    });


    Router.route('/purchase-article/:_id', {
        name: 'PurchaseArticle'
        ,layoutTemplate: 'Visitor'
        ,waitOn: function(){
            return[
            Meteor.subscribe('articleInfo',this.params._id)
            ,Meteor.subscribe('currentUser')
            ]
        }
        ,data: function(){
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


    /*recommendations*/
    Router.route('/admin/recommendations',{
        name: 'AdminRecommendations',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return [
                Meteor.subscribe('recommendations')
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    recommendations: recommendations.find().fetch()
                }
            }
        }
    });
    Router.route('/admin/recommendation/:_id',{
        name: 'AdminRecommendationUpdate',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return [
                Meteor.subscribe('recommendationData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    recommendation: recommendations.findOne({'_id':this.params._id})
                }
            }
        }

    });

    /*data submissions*/
    Router.route('/admin/data_submissions',{
        name: 'AdminDataSubmissions',
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
        	Session.set('submission_list',null);
        	Session.set('error',false);
        	this.next();
        },
        waitOn: function(){
            return[
	            Meteor.subscribe('issues'),
	            Meteor.subscribe('volumes')
            ]
        }
    });
    Router.route('/admin/data_submissions/past',{
        name: 'AdminDataSubmissionsPast',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('adminUsers'),
                Meteor.subscribe('submissions'),
                Meteor.subscribe('articles')
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    articles: articles.find({},{submissions:1}).fetch(),
                    submissions: submissions.find().fetch()
                }
            };
        }
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
        name: 'AdminArticlesList',
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
        name: 'AdminArticle',
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
			Session.set('preprocess-article',true);
			this.next();
        },
        waitOn: function(){
            return[
				Meteor.subscribe('articleInfo',this.params._id),
				Meteor.subscribe('volumes'),
				Meteor.subscribe('issues')
            ]
        },
        data: function(){
            if(this.ready()){
                Session.set('article-id',this.params._id);
            }
        }
    })

    /*archive browsing*/
    Router.route('/admin/archive', {
        name: 'adminArchive',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
            	Meteor.subscribe('volumes'),
            	Meteor.subscribe('issues'),
            	Meteor.subscribe('articles')
            ]
        }
    });


/*issue control*/
//TODO: LIMIT subscription of articles to just issue
Router.route('/admin/issue/:vi', {
        name: 'AdminIssue',
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
        }
        ,data: function(){
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

                if(u.subscribed) {
                    u['subbed'] = 'checked';
                }

                return {
                    u: u
                };
            }
        }
    });
Router.route('/admin/user/:_id/subs', {
        name: 'AdminUserSubs',
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
            	Meteor.subscribe('userData',this.params._id),
            	Meteor.subscribe('issues')
            ]
        },
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                var u = Meteor.users.findOne({'_id':id});


                return {
                    u: u
//                    ,volumes:volumes
//                    ,issues:issues
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
        name: 'AdminInstitution'
        ,layoutTemplate: 'Admin'
        ,waitOn: function(){
            return[
            Meteor.subscribe('institutions')
            ]
        }
        ,data: function () {
            return {
                institutions: institutions.find({})
            };
        }
    });

Router.route('/admin/institution/add', {
        layoutTemplate: 'Admin',
        name: 'AdminInstitutionAdd',
        data: function(){
            return {
                insertForm: true
            }
        }
    });

Router.route('/admin/institution/edit/:_id', {
        layoutTemplate: 'Admin',
        name: 'AdminInstitutionForm',
        waitOn: function(){
            return[
            Meteor.subscribe('institution',this.params._id)
            ]
        }
        ,data: function(){
            return {
                institution: institutions.findOne({"_id":this.params._id})
                ,updateForm: true
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
