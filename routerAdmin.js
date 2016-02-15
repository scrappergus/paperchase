/*
 ADMIN ROUTES
*/

// Download
Router.route('/admin/doi_status_csv/',{
	name: 'doiStatusCsv',
	where: 'server',
	action: function(){
		var filename = journalConfig.findOne().journal.short_name + '_doi_status.csv';
		var csvData = 'PII,Registered,Deposited,Indexed, DOI Article Date, DOI Article Print Date,Article Date, DOI, PMC ID, PubMed ID' + '\n';
		Meteor.call('getAllArticlesDoiStatus',function(error,result){
			if(error){
				console.error('ERROR - get DOI status');
				console.error(error);
				throw new Meteor.Error(503, 'ERROR: DOI Registered Check', error);
			}else if(result){
				for(var i=0 ; i< result.length ; i++){
					var epub = '',
						registered = '',
						deposited = '',
						indexed = '',
						crossRefEpub = '',
						crossRefPrint = '',
						doi = '',
						pmc = '',
						pmid = '',
						pii = '';

					if(result[i]['paperchase']['dates'] && result[i]['paperchase']['dates']['epub']){
						epub = moment(result[i]['paperchase']['dates']['epub']).format('YYYY-MM-D');
					}
					if(result[i]['paperchase']['ids']['pmc']){
						pmc = result[i]['paperchase']['ids']['pmc'];
					}
					if(result[i]['paperchase']['ids']['pmid']){
						pmid = result[i]['paperchase']['ids']['pmid'];
					}
					if(result[i]['paperchase']['ids']['pii']){
						pii = result[i]['paperchase']['ids']['pii'];
					}
					if(result[i]['deposited']['timestamp']){
						deposited = moment(result[i]['deposited']['timestamp']).format('YYYY-MM-D');
					}
					if(result[i]['indexed_date']){
						indexed = moment(result[i]['indexed_date']).format('YYYY-MM-D');
					}
					if(result[i]['crossref_epub_date']){
						crossRefEpub = result[i]['crossref_epub_date'];
					}
					if(result[i]['crossref_print_date']){
						crossRefPrint = result[i]['crossref_print_date'];
					}
					if(result[i]['doi']){
						doi = result[i]['doi'];
					}
					if(result[i]['registered']){
						registered = result[i]['registered'];
					}

					csvData += pii + ',' + registered + ',' + deposited + ',' + indexed + ',' + crossRefEpub + ',' + crossRefPrint + ',' + epub + ',' + doi + ',' + pmc + ',' + pmid + '\n';
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
	Session.setDefault('articles-doi-status',null);
	// Batch page
	Session.setDefault('articles-assets-audit',null);
	Session.setDefault('articles-ncbi-audit',null);
	// Articles audit
	Session.setDefault('articles-duplicate', null);
	// Advance
	Session.setDefault('advanceAdmin',null);
	Session.setDefault('advanceDiff',null);
	Session.setDefault('advanceLegacy',null);
	// forms
	Session.setDefault('savedMessage',null);
	Session.setDefault('errorMessage',null);
	Session.setDefault('statusModalAction',null);


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
				if(sorted){
					return {
						sections : sorted['ordered']
					};
				}
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
			Meteor.call('archive',function(error,result){
				if(error){
					console.error('Archive Error', error);
				}else if(result){
					Session.set('archive',result);
				}
			});
			Session.set('submission_list',null);
			Session.set('error',false);
			this.next();
		},
		waitOn: function(){
			return[
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

				if(sorted && sorted['articles']){
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
	Router.route('/admin/articles/audit',{
		name: 'AdminArticlesAudit',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Articles Audit';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			Meteor.call('allArticlesAssetsAudit',function(error,result){
				if(error){
					throw new Meteor.Error(error);
				}else{
					Session.set('articles-assets-audit',result);
				};
			});
			Meteor.call('pubMedAndPmcAudit',function(error,result){
				if(error){
					throw new Meteor.Error(error);
				}else{
					Session.set('articles-ncbi-audit',result);
				};
			});
			Meteor.call('duplicateArticles',function(error,result){
				if(error){
					throw new Meteor.Error(error);
				}else{
					Session.set('articles-duplicate',result);
				};
			});
			this.next();
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
				Meteor.subscribe('sections'),
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var sorted  = sorters.findOne({name:'advance'});
				// var output = [];
				// var last_article = {};
                // var section_count = 0;
                // var section_start_index = 0;

                var output = Meteor.advance.groupArticles(sorted.articles);

                var advance = publish.findOne({name: 'advance'}, {sort:{'pubtime':-1}});

                Session.set('advanceAdmin',output);

				return{
					// sections: output,
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
		onBeforeAction: function(){
			Meteor.call('ojsGetAdvanceArticles', function(error,ojsArticles){
				if(ojsArticles){
					Session.set('advanceLegacy',ojsArticles)
					Meteor.call('compareWithLegacy', ojsArticles, function(error,result){
						if(result){
							Session.set('advanceDiff',result)
						}
					});
				}
			});
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
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
		name: 'AdminArchive',
		title: function() {
			var pageTitle = 'Admin | Archive ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			Meteor.call('archive',function(error,result){
				if(error){
					console.error('Archive Error', error);
				}else if(result){
					Session.set('archive',result);
				}
			});
			this.next();
		}
	});

	// Issue
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
		onBeforeAction: function(){
			Session.set('issue',null);
			var pieces = Meteor.issue.urlPieces(this.params.vi);
			// TODO: add redirect if no issue
			Meteor.call('getIssueAndAssets', pieces.volume, pieces.issue, function(error,result){
				if(error){
					console.log('ERROR - getIssueAndAssets');
					console.log(error);
				}
				if(result){
					Session.set('issue',result);
				}
			});

			this.next();
		},
	});
	Router.route('/admin/add_issue/', {
		name: 'AdminAddIssue',
		title: function() {
			var pageTitle = 'Admin | Add Issue ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
	});

	// Volume
	Router.route('/admin/volume/:v', {
		name: 'AdminVolume',
		title: function() {
			var pageTitle = 'Admin | Volume ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		layoutTemplate: 'Admin',
		onBeforeAction: function(){
			Session.set('volume',null);
			// TODO: add redirect if no volume

			Meteor.call('getVolume', this.params.v, function(error,result){
				if(error){
					console.log('ERROR - getVolume');
					console.log(error);
				}
				if(result){
					Session.set('volume',result);
				}
			});

			this.next();
		},
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
		onBeforeAction: function(){
			Meteor.call('archive',function(error,result){
				if(error){
					console.error('Archive Error', error);
				}else if(result){
					Session.set('archive',result);
				}
			});
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('userData',this.params._id)
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
		name: 'AdminBatch',
		layoutTemplate: 'Admin',
		title: function() {
			var pageTitle = 'Admin | Batch Process ';
			if(Session.get('journal')){
				pageTitle += ': ' + Session.get('journal').journal.name;
			}
			return pageTitle;
		},
		onBeforeAction: function(){
			Meteor.call('allArticlesAssetsAudit',function(error,result){
				if(error){
					throw new Meteor.Error(error);
				}else{
					Session.set('articles-assets-audit',result);
				};
			});
			Meteor.call('pubMedAndPmcAudit',function(error,result){
				if(error){
					throw new Meteor.Error(error);
				}else{
					Session.set('articles-ncbi-audit',result);
				};
			});
			this.next();
		}
	});
}
