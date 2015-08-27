
Institutions = new Mongo.Collection("institutions");
IPRanges = new Mongo.Collection("ipranges");

var Schemas = {};

Schemas.Institutions = new SimpleSchema({
    institution: {
        type: String,
        label: "Institution",
        max: 200
    },
    address: {
        type: String
        ,label: "Address"
        ,max: 200
        ,optional:true
        ,autoform: {
            rows: 5
        }
    },
    IPRanges: {
        type: Array,
        label: "IP Ranges",
        optional: true,
        minCount: 0,
        maxCount: 20
    },
    "IPRanges.$": {
        type: Object
    },
    "IPRanges.$.startIP": {
        type: String 
    },
    "IPRanges.$.endIP": {
        type: String
    }
});


Schemas.IPRanges = new SimpleSchema({
    institutionID: {
        type: String,
        max: 200
    },
    "startIP": {
        type: String 
    },
    "endIP": {
        type: String
    },
    "startNum": {
        type: Number
    },
    "endNum": {
        type: Number
    }

});

IPRanges.attachSchema(Schemas.IPRanges);
Institutions.attachSchema(Schemas.Institutions);

institutionUpdateInsertHook = function(userId, doc, fieldNames, modifier, options) {
        var iprnew = [];
        var iprid = IPRanges.find({institutionID: doc._id});
        iprid.forEach(function(rec) {
                IPRanges.remove({_id: rec._id});
            });

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
                return Institutions.findOne({_id:this.params._id});
            }
        });

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


	/*
	ADMIN PAGES
	*/

    Router.route('/admin', {
            name: 'admin.home'
            ,layoutTemplate: 'Admin'
        });

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

    Router.route('/admin/institution', {
            name: 'admin.institution'
            ,layoutTemplate: 'Admin'
        });

    Router.route('/admin/institution/add', {
            name: 'admin.institution.add'
            ,layoutTemplate: 'Admin'
        }, function() {
            this.go('/admin/institutions');
        });
    
    Router.route('/admin/institution/edit/:_id', 
        function() {
            this.layout("Admin");
            var institution = Institutions.findOne({_id:this.params._id});

            this.render('AdminInstitutionEdit', {data: institution});
            
        });
}

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


