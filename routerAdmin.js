/*
 ADMIN ROUTES
*/

// Download
Router.route('/admin/doi_status_csv/',{
	name: 'doiStatusCsv',
	where: 'server',
	action: function(){
		var filename = journalConfig.findOne().journal.short_name + '_doi_status.csv';
		var csvData = 'PII,Registered,Deposited,Indexed, DOI Article Date,Article Date, DOI, PMC ID, PubMed ID' + '\n';
		Meteor.call('getAllArticlesDoiStatus',function(error,result){
			if(error){
				console.error('ERROR - get DOI status');
				console.error(error);
				throw new Meteor.Error(503, 'ERROR: DOI Registered Check', error);
			}else if(result){
				for(var i=0 ; i< result.length ; i++){
					var epub = moment(result[i]['epub']).format('YYYY-MM-D');
					var deposited = moment(result[i]['deposited']['timestamp']).format('YYYY-MM-D');
					var indexed = moment(result[i]['indexed_date']).format('YYYY-MM-D');
					csvData += result[i]['pii'] + ',' + result[i]['registered'] + ',' + deposited + ',' + indexed + ',' + result[i]['article_date'] + ',' + epub + ',' + result[i]['doi'] + ',' + result[i]['pmc'] + ',' + result[i]['pmid'] + '\n';
				}
			}
		});
		this.response.writeHead(200, {
		  'Content-Type': 'text/csv',
		  'Content-Disposition': 'attachment; filename=' + filename
		});
		this.response.write(csvData);
		this.response.end();
	}
});

if (Meteor.isClient) {
	// Variables
	// ----------
	Session.setDefault('article',null);	// Article Form
	Session.setDefault('xml-uploaded',false);// After uploading XML

	// For Authors
	Session.setDefault('showForm',false);
	Session.setDefault('sectionId',null);
	// About
	Session.set('showAboutForm',false);
	Session.set('aboutSectionId', null);
	// News
	Session.setDefault('newsId',null);
	// Paper sections
	Session.setDefault('paperSectionId',null);
	// DOI Status, articles list
	Session.set('articles-doi-status',null);


	Router.route('/admin', {
		name: 'admin.dashboard',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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

	// About
	Router.route('/admin/about', {
		name: 'AdminAbout',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | About ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('about'),
				Meteor.subscribe('sortedList','about')
			]
		},
		data: function(){
			// Keep data declarations here
			// when adding data via template helper, the array shows as an object and there is an error:
			// {#each}} currently only accepts arrays, cursors or falsey values.
			if(this.ready()){
				var sorted  = sorters.findOne();
				return {
					sections : sorted['ordered']
				};
			}
		}
	});

	// Site control
	Router.route('/admin/site-control', {
		name: 'AdminSiteControl',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Site Control ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('sectionsAll'),
				Meteor.subscribe('sortedList','sections')
			]
		},
		data: function(){
			if(this.ready()){
				var sorted  = sorters.findOne();
				// more data set is AdminHelpers.js (main side nav)
				return {
					sectionSideNav : sorted['ordered']
				};
			}
		}
	});

	// News
	Router.route('/admin/news',{
		name: 'AdminNews',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | News ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return [
				Meteor.subscribe('newsListAll')
			]
		}
	});
	Router.route('/admin/news-add',{
		name: 'AdminNewsAdd',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Add News ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return [
				// Meteor.subscribe('news')
			]
		}
	});
	Router.route('/admin/news-edit/:_id',{
		name: 'AdminNewsEdit',
		title: function() {
			var pageTitle = 'Admin | Edit News ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			Session.set('newsId',this.params._id);
			this.next();
		},
		waitOn: function(){
			return [
				Meteor.subscribe('newsItem', this.params._id)
			]
		}
	});

	// Recommendations
	Router.route('/admin/recommendations',{
		name: 'AdminRecommendations',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Recommendations ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
		title: function() {
			var pageTitle = 'Admin | Recommendations ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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

	// Data submissions
	Router.route('/admin/data_submissions',{
		name: 'AdminDataSubmissions',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Data Submissions ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			Session.set('submission_list',null);
			Session.set('error',false);
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('issues'),
				Meteor.subscribe('volumes'),
				Meteor.subscribe('articleTypes')
			]
		}
	});
	Router.route('/admin/data_submissions/past',{
		name: 'AdminDataSubmissionsPast',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Past Data Submissions ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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

	// Intake
	// xml uploading
	Router.route('/admin/upload/xml',{
		name: 'AdminArticleXmlUpload',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | XML Upload ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
	});

	// Article
	Router.route('/admin/articles',{
		name: 'adminArticlesDashboard',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Articles Dashboard';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('feature'),
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var journal;
				var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
				var sorted  = sorters.findOne();
				var sortedArticles;
				// var journalSettings = journalConfig.findOne();
				if(Session.get('journal')){
					journal = Session.get('journal').journal;
				}

				if(sorted['articles']){
					sortedArticles = sorted['articles'];
				}
				return {
					feature : featureList,
					advance : sortedArticles,
					journal : journal
				}
			}
		}
	});
	Router.route('/admin/articles/list',{
		name: 'AdminArticlesList',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Articles List';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
		name: 'AdminArticleOverview',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Article ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			// check if article exists
			var articleExistsExists = articles.findOne({'_id': this.params._id});
			if(!articleExistsExists){
				// if the mongo id search found nothing, search by pii
				var articlePii = String(this.params._id);
				var articleByPii = articles.findOne({'ids.pii': articlePii});
				// check if :_id is a pii and not Mongo ID
				if(articleByPii){
					Router.go('AdminArticle', {_id: articleByPii._id});
				}else{
					Router.go('AdminArticleAdd');
				}
			}
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('articleInfo',this.params._id)
			]
		},
		data: function(){
			if(this.ready()){
				Session.set('article',articles.findOne());
			}
		}
	});
	Router.route('/admin/article/:_id/edit',{
		name: 'AdminArticle',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Edit Article ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			// check if article exists
			var articleExistsExists = articles.findOne({'_id': this.params._id});
			if(!articleExistsExists){
				// if the mongo id search found nothing, search by pii
				var articlePii = String(this.params._id);
				var articleByPii = articles.findOne({'ids.pii': articlePii});
				// check if :_id is a pii and not Mongo ID
				if(articleByPii){
					Router.go('AdminArticle', {_id: articleByPii._id});
				}else{
					Router.go('AdminArticleAdd');
				}
			}

			Meteor.call('preProcessArticle',this.params._id,function(error,result){
				if(error){
					console.log('ERROR - preProcessArticle');
					console.log(error);
				}
				if(result){
					Session.set('article',result);
				}
			});
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('articleInfo',this.params._id)
			]
		},
		data: function(){
			if(this.ready()){
				Session.set('article-id',this.params._id);
			}
		}
	});
	Router.route('/admin/add_article/',{
		name: 'AdminArticleAdd',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Add Article ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			Meteor.call('preProcessArticle',function(error,result){
				if(error){
					console.log('ERROR - preProcessArticle');
					console.log(error);
				}
				if(result){
					Session.set('article',result);
				}
			});
			this.next();
		},
	});

	// DOI
	Router.route('/admin/doi_status', {
		name: 'AdminDoiStatus',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | DOI Status ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			Meteor.call('getAllArticlesDoiStatus',function(error,result){
				if(error){
					console.error('ERROR - get DOI status');
					console.error(error);
					throw new Meteor.Error(503, 'ERROR: DOI Registered Check', error);
				}
				if(result){
					Session.set('articles-doi-status',result);
				}
			});
			this.next();
		}
	});


	// Advance articles
	Router.route('/admin/articles/advance',{
		name: 'AdminAdvanceArticles',
		title: function() {
			var pageTitle = 'Admin | Advance Articles ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('publish'),
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var sorted  = sorters.findOne({name:'advance'});
				var output = [];
				var last_article = {};
				var recent = true;
                var section_count = 0;
                var section_start_index = 0;
				for (var i = 0; i < sorted.articles.length; i++){
					article = sorted.articles[i];

					//make a copy of the next article for comparison
					next_article = sorted.articles[i+1] || false;

					//things that happen on the first entry
					if(i==0) {
						article['first'] = true;
						article['section_start'] = true;
					}

					//mark the rest as not being first
					first = false;



					//things that happen if we're starting a new section
					if(article.section_name != last_article.section_name) {
						article['section_start'] = true;
					}


					//things that happen if we're ending a section
					if(article.section_name != next_article.section_name) {
						article['section_end'] = true;
					}

					//record this entry for comparison on the next
					last_article = article;
					//record changes to actual article entry
					if(article.section_start) {

						section_name = article.section_name;
						section_id = article.section_id;
						if(section_name == 'Research Papers' && recent === true) {
							recent = false;
							section_name = 'Recent Research Papers';
						}

						output.push({
								articles:[],
								section_name:section_name,
								section_id:section_id
							});

                        //set section count in previous section
                        output[section_start_index]['section_length'] = section_count;
                        section_count = 0;
                        section_start_index = output.length - 1;

					}
                    section_count++;
					output[output.length-1]['articles'].push(article);
				}

                var advance = publish.findOne({name: 'advance'}, {sort:{'pubtime':-1}});

				return{
					sections: output,
                    pubdate: advance.pubtime.toLocaleDateString(),
                    pubtime: advance.pubtime.toLocaleTimeString(),
                    total: sorted.articles.length
				}
			}
		}
	});
	Router.route('/admin/articles/advance-diff',{
		name: 'AdminAdvanceArticlesDiff',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Advance Articles Difference ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
            if(this.ready()){

                var articles = [];
                $.ajax({
                        type: 'GET',
                        url: "http://impactjournals.com//ojs-api/?v=5&i=0",
                        dataType: 'json',
                        async: false,
                        success: function(data) {
                            articles = data.articles;
                        }
                    });

                var sorted  = sorters.findOne({name:'advance'});

               	// console.log(articles);
               	// console.log(sorted);

                var diff = {};
                var ojs_count = 0;
				for(var i = 0; i < articles.length ; i++){
                    ojs_count++;
                    article = articles[i];
                    diff[article['pii']] = {ojs:true};
                }


                var pc_count = 0;
                var pc_ids = {};
				for(var i = 0; i < sorted.articles.length ; i++){
                    pc_count++;
                    article = sorted.articles[i];
                    var pii = article.ids['pii'];
                    if(diff[pii] === undefined) {
                        diff[pii] = {};
                    }
                    diff[pii].paperchase = true;
                    pc_ids[pii] = article["_id"];
                }

                var only_ojs = [];
                var only_pc = [];
                var total_count = 0;
                $.each(diff, function(k,v) {
                        total_count++;
                        if(v['ojs'] === true && v['paperchase'] !== true) {
                            only_ojs.push({pii:k});
                        }

                        if(v['ojs'] !== true && v['paperchase'] === true) {
                            only_pc.push({pii:k,paperchaseId:pc_ids[k]});
                        }
                    });

                return {
                    "ojs_count": ojs_count,
                    "pc_count": pc_count,
                    "total_count": total_count,
                    "only_ojs": only_ojs,
                    "only_pc": only_pc
                }
			}
		}
	});

	// Sections
	Router.route('/admin/sections', {
		name: 'AdminSections',
		title: function() {
			var pageTitle = 'Admin | Sections ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('sectionsAll')
			]
		}
	});
	Router.route('/admin/sections-add', {
		name: 'AdminSectionsAdd',
		title: function() {
			var pageTitle = 'Admin | Add Section ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				// sections
			]
		}
	});
	Router.route('/admin/sections/:_id',{
		name: 'AdminSectionPapers',
		title: function() {
			var pageTitle = 'Admin | Section Papers ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			Session.set('paperSectionId',this.params._id);
			this.next();
		},
		waitOn: function(){
			return [
				Meteor.subscribe('sectionPapers', this.params._id)
			]
		}
	});
	Router.route('/admin/sections-edit/:_id',{
		name: 'AdminSectionsEdit',
		title: function() {
			var pageTitle = 'Admin | Edit Section ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			Session.set('paperSectionId',this.params._id);
			this.next();
		},
		waitOn: function(){
			return [
				Meteor.subscribe('sectionItem', this.params._id)
			]
		}
	});

	// Archive
	Router.route('/admin/archive', {
		name: 'adminArchive',
		title: function() {
			var pageTitle = 'Admin | Archive ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('volumes'),
				Meteor.subscribe('issues'),
				Meteor.subscribe('articles')
			]
		}
	});

	// Issue
	// TODO: LIMIT subscription of articles to just issue
	Router.route('/admin/issue/:vi', {
		name: 'AdminIssue',
		title: function() {
			var pageTitle = 'Admin | Issue ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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

	// Users
	Router.route('/admin/users', {
		name: 'AdminUsers',
		title: function() {
			var pageTitle = 'Admin | Users ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
		title: function() {
			var pageTitle = 'Admin | User ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
		title: function() {
			var pageTitle = 'Admin | User ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
					//,volumes:volumes
					//,issues:issues
				};
			}
		}
	});
	Router.route('/admin/adduser', {
		name: 'AdminAddUser',
		title: function() {
			var pageTitle = 'Admin | Add User ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin'
	});

	// Authors
	Router.route('/admin/authors', {
		name: 'AdminAuthors',
		title: function() {
			var pageTitle = 'Admin | Authors ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
	Router.route('/admin/author/:_id', {
		name: 'AdminAuthor',
		title: function() {
			var pageTitle = 'Admin | Author ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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

	// Editorial Board
	Router.route('/admin/editorial-board', {
		name: 'AdminEditorialBoard',
		title: function() {
			var pageTitle = 'Admin | Editorial Board ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('entireBoard'),
			]
		},
		data: function(){
			if(this.ready()){
				var edboardList = edboard.find().fetch();
				// console.log(edboardList);
				return {
					edboard : edboardList
				};
			}
		}
	});
	Router.route('/admin/editorial-board/add', {
		name: 'AdminEditorialBoardAdd',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Add Editorial Board ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		data: function(){
			if(this.ready()){
				return {
					member : Meteor.adminEdBoard.formPrepareData()
				};
			}
		}
	});
	Router.route('/admin/editorial-board/edit/:_id', {
		name: 'AdminEditorialBoardEdit',
		title: function() {
			var pageTitle = 'Admin | Edit Editorial Board ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			// TODO
			// Redirect if no member
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('edBoardMember',this.params._id),
			]
		},
		data: function(){
			if(this.ready()){
				return {
					member : Meteor.adminEdBoard.formPrepareData(this.params._id)
				};
			}
		}
	});

	// For Authors
	Router.route('/admin/for-authors', {
		name: 'AdminForAuthors',
		title: function() {
			var pageTitle = 'Admin | For Authors ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('forAuthors'),
				Meteor.subscribe('sortedList','forAuthors')
			]
		},
		data: function(){
			// Keep data declarations here
			// when adding data via template helper, the array shows as an object and there is an error:
			// {#each}} currently only accepts arrays, cursors or falsey values.
			if(this.ready()){
				var sections = forAuthors.find().fetch();
				var sorted  = sorters.findOne();
				return {
					sections : sorted['ordered']
				};
			}
		}
	});

	// Institutions
	Router.route('/admin/institution', {
		name: 'AdminInstitution',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Institutions ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('institutions')
			]
		},
		data: function () {
			return {
				institutions: institutions.find({})
			};
		}
	});
	Router.route('/admin/institution/add', {
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Add Institution ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
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
		title: function() {
			var pageTitle = 'Admin | Edit Institution ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
			Meteor.subscribe('institution',this.params._id)
			]
		},
		data: function(){
			return {
				institution: institutions.findOne({"_id":this.params._id}),
				updateForm: true
			}
		}
	});

	// Crawl
	Router.route('/admin/crawl',{
		name: 'adminCrawl',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Crawl ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		data: function(){
			if(this.ready()){
				var journal;
				if(Session.get('journal')){
					journal = Session.get('journal').journal;
				}
				return {
					journal : journal
				}
			}
		}
	});

	//this route is used to query pmc for all xml.. don't go here.
	Router.route('/admin/batch_process', {
		name: 'AdminBatchXml',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Batch Process ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		waitOn: function(){
			return[
				Meteor.subscribe('articles')
			]
		},
	});
}
