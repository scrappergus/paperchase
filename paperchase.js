// Config
if (Meteor.isServer) {
	WebApp.connectHandlers.use(function(req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });
}

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

Meteor.startup(function () {
	if (Meteor.isServer) {
		var emailSettings = Meteor.call('getConfigRecommendationEmail');
		if(emailSettings){
			process.env.MAIL_URL = 'smtp://' + emailSettings['address'] +':' + emailSettings['pw'] + '@smtp.gmail.com:465/';
		}
	}
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


// DOWNLOAD ROUTES
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

// INTAKE ROUTES
Router.route('/admin/add-legacy-platform-article/',{
	where: 'server',
	action: function(){
		Meteor.call('legacyArticleIntake', this.params.query);
        this.response.setHeader('Content-Type', 'application/json');
        this.response.end(JSON.stringify({'success':true}));
        
	}
});

// OUTTAKE ROUTES
Router.route('/get-advance-articles/',{
	where: 'server',
	waitOn: function(){
		return[
			Meteor.subscribe('advance'),
			Meteor.subscribe('sortedList','advance')
		]
	},
	action: function(){
		// var htmlString = '<head><meta charset="UTF-8"></head><body>';
		var htmlString = "<body>";
		var advance = sorters.findOne({name: 'advance'});
		if(advance && advance.articles){
			var advanceList = advance.articles;
			var prevSection;
            var last_index;

            if(this.params.query.rangeStart !== undefined) {
                var rangeSize = this.params.query.rangeSize*1 || 3;
                var rangeStart = this.params.query.rangeStart*rangeSize
                var rangeEnd = rangeStart + rangeSize;
                if(rangeEnd > advanceList.length) rangeEnd = advanceList.length;
            }
            else {
                var rangeStart = 0;
                var rangeEnd = advanceList.length;
            }

            var parity=0;
			for(var i = rangeStart ; i < rangeEnd; i++){
                parity++;
				var articleInfo = advanceList[i];
                last_index = i-1
                if(i > 0) {
                    prevSection = advanceList[last_index]['section_name'];
                }
				if(articleInfo['section_start']){
//					if(prevSection){
//						htmlString += '</div>';
//					}

//					htmlString += '<h4 class="tocSectionTitle" style="width:100%;clear:both;float:left;font-family:Arial, sans-serif;margin-top: 1em;padding-left: 1.5em;color: #FFF;background-color: #999;margin-bottom: 1em;border-left-width: thick;border-left-style: solid;border-left-color: #666;border-bottom-width: thin;border-bottom-style: solid;border-bottom-color: #666;text-transform: none !important; ">' + articleInfo['section_name'] + '</h4>';
//					htmlString += '<div class="articlewrapper">';
				}


                if(articleInfo['section_name'] != prevSection) {
                    if(i != 0) {
                        htmlString += '</div>';
                    }

                    if(i<40 && articleInfo['section_name'] == 'Research Papers') {
                        htmlString += "<h4 id=\"recent_"+articleInfo['section_name']+"\" class=\"tocSectionTitle\">Recent "+articleInfo['section_name']+"</h4>";
                    }
                    else {
                        htmlString += "<h4 id=\""+articleInfo['section_name']+"\" class=\"tocSectionTitle\">"+articleInfo['section_name']+"</h4>";
                    }

                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";
                    parity = 1;
                }
                else if(parity%2==1) {
                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";

                }

                htmlString += "<div style=\"width:360px; margin-right:15px; float:left;\" class=\"clearfix\">";
			    htmlString += '<span class="tocTitle">' + articleInfo['title'] + '</span>';

				if(articleInfo.authors){
//					htmlString += '<tr>';
//					htmlString += '<td class="tocAuthors">';

					htmlString += '<span class="tocAuthors">';

					if(articleInfo['ids']['pii']){
						htmlString += '<p><b>DOI: 10.18632/oncotarget.' + articleInfo['ids']['pii'] + '</b></p>';
					}
					var authors = articleInfo.authors;
					var authorsCount = authors.length;
					htmlString += '<p>';
					for(var a = 0 ; a < authorsCount ; a++){
						if(authors[a]['name_first']){
							htmlString += ' ' + authors[a]['name_first'];
						}
						if(authors[a]['name_middle']){
							htmlString += ' ' + authors[a]['name_middle'];
						}
						if(authors[a]['name_last']){
							htmlString += ' ' + authors[a]['name_last'];
						}
						if(a != parseInt(authorsCount - 1)){
							if(authors[a]['name_first'] || authors[a]['name_middle'] || authors[a]['name_last']){
								htmlString += ', ';
							}
						}
					}
					htmlString += '</p>';
					htmlString += '</span>';
				}

				// LINKS
				htmlString += '<span class="tocGalleys">';
				// Abstract
				if(articleInfo.legacy_files){
//					if(articleInfo.legacy_files.abstract && articleInfo.legacy_files.abstract != ''){
						htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]='+ articleInfo.ids.pii +'" class="file">Abstract</a>';
						htmlString += '&nbsp;';
//					}
					// HTML
					if(articleInfo.legacy_files.html_galley_id){
						htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=' + articleInfo.legacy_files.html_galley_id + '" class="file">HTML</a>';
						htmlString += '&nbsp;';
					}
					// PDF
					if(articleInfo.legacy_files.pdf_galley_id){
						htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=' + articleInfo.pdf_galley_id + '" class="file">PDF</a>';
						htmlString += '&nbsp;';
					}
					// Supplemental
					if(articleInfo.legacy_files.has_supps){
						htmlString += '<a href="javascript:openRTWindow(\'http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=rt&amp;op=suppFiles&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=\');" class="file">Supplementary Information</a>';
						htmlString += '&nbsp;';
					}
				}

				htmlString += '</span>';

				htmlString += '</div>';

                if(parity%2==0) {
                    htmlString += '</div>';
                }
			}

			htmlString += '</body>';
			var headers = {'Content-type': 'text/html', 'charset' : 'UTF-8'};
			this.response.writeHead(200, headers);
			this.response.end(htmlString);
		}
	}
});

if (Meteor.isClient) {
	Session.setDefault('formMethod','');
	Session.setDefault('fileNameXML',''); //LIVE
	// Session.setDefault('fileNameXML','PMC2815766.xml'); //LOCAL TESTING
	Session.setDefault('error',false);
	Session.setDefault('errorMessages',null);
	Session.setDefault('articleData',null);
	Session.setDefault('article',null);
	Session.setDefault('article-id',null);
	Session.setDefault('article-assets',null);
	Session.setDefault('article-text','');
	Session.setDefault('affIndex',null);
	Session.setDefault('missingPii',null);
	Session.setDefault('preprocess-article',false);
	Session.setDefault('issue',null);

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
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName;
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/advance', {
		name: 'advance',
		layoutTemplate: 'Visitor',
		waitOn: function(){
			return[
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var sorted  = sorters.findOne();
				return {
					advance : sorted['articles']
				}
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Advance Articles';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/account', {
		name: 'Account',
		layoutTemplate: 'Visitor',
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Account';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
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
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Archive';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
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
				eic: edboard.find({role:"Editor-in-Chief"}),
				fullBoard: edboard.find({$or: [{role:"Founding Editorial Board"}, {role:"Editorial Board"}]})
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Editorial Board';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/for-authors', {
		name: 'ForAuthors',
		layoutTemplate: 'Visitor',
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | For Authors';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/about', {
		name: 'About',
		layoutTemplate: 'Visitor',
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | About';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/contact', {
		name: 'Contact',
		layoutTemplate: 'Visitor',
		waitOn: function(){
			return[
				Meteor.subscribe('contact')
			]
		},
		data: function(){
			if(this.ready()){
				var contactInfo = contact.findOne();
				return {
					contact: contactInfo
				};
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Contact';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/recent-breakthroughs', {
		name: 'RecentBreakthroughs',
		layoutTemplate: 'Visitor',
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Recent Breakthroughs';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	Router.route('/issue/:vi', {
		name: 'issue',
		layoutTemplate: 'Visitor',
		onBeforeAction: function(){
			// console.log('..before');
			Session.set('issue',null);
			var vi = this.params.vi;
			var matches = vi.match('v([0-9]+)i([0-9]+)');
			var volume = parseInt(matches[1]);
			var issue = parseInt(matches[2]);

			Meteor.call('getIssueAndAssets',volume,issue,function(error,result){
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
		waitOn: function(){
			return[
				Meteor.subscribe('issues'),
				Meteor.subscribe('articles'),
			]
		},
		// data: function(){
		// 	if(this.ready()){
		// 		// console.log(issueData);
		// 		return {
		// 			issue: Session.get('issue');
		// 		};
		// 	}
		// },
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;
			var vi = this.params.vi;
			var matches = vi.match('v([0-9]+)i([0-9]+)');
			var volume = parseInt(matches[1]);
			var issue = parseInt(matches[2]);

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Volume ' + volume + ', Issue ' + issue;
			}

			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});

	/*article*/
	Router.route('/article/:_id', {
		name: 'Article',
		layoutTemplate: 'Visitor',
		onBeforeAction: function(){
			Meteor.call('availableAssests', this.params._id, function(error, result) {
				if(result){
					Session.set('article-assets',result);
				}
			});
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('articleInfo',this.params._id),
				Meteor.subscribe('articleTypes')
			]
		},
		data: function(){
			if(this.ready()){
				var id = this.params._id;
				Session.set('article-id',this.params._id);
				var article;
				article = articles.findOne({'_id': id});
				return {
					article: article
				};
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName,
				id,
				article,
				articleTitlePlain,
				articleTitle;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			article = articles.findOne({'_id': id});
			if(article){
				// Title
				articleTitle = article.title
				var tmp = document.createElement('DIV');
				tmp.innerHTML = articleTitle;
				articleTitlePlain = tmp.textContent || tmp.innerText || "";
				// Description
				// pageDescription = article.title;
			}
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName && articleTitlePlain){
				pageTitle = journalName + ' | ' + articleTitlePlain;
			}

			// SEO.set({
			// 	title: pageTitle,
			// 	meta: {
			// 		'description': pageDescription
			// 	},
			// 	og: {
			// 		'title': pageTitle,
			// 		'description': pageDescription
			// 	}
			// });
			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});
	Router.route('/article/:_id/text', {
		name: 'ArticleText',
		layoutTemplate: 'Visitor',
		onBeforeAction: function(){
			Session.set('article-text', null);
			Meteor.call('availableAssests', this.params._id, function(error, result) {
				if(result){
					Session.set('article-assets',result);
				}
			});
			Meteor.call('getAssetsForFullText', this.params._id, function(error, result) {
				if(result){
					Session.set('article-text',result);
				}
			});
			this.next();
		},
		waitOn: function(){
			return[
				Meteor.subscribe('articleInfo',this.params._id),
				// Meteor.subscribe('articleFullText',this.params._id),
				Meteor.subscribe('articleTypes')
			]
		},
		data: function(){
			if(this.ready()){
				var id = this.params._id;
				Session.set('article-id',this.params._id);
				var article = articles.findOne({'_id': id});
				return {
					article: article,
				};
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName,
				id,
				article,
				articleTitlePlain,
				articleTitle;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			article = articles.findOne({'_id': id});
			if(article){
				// Title
				articleTitle = article.title
				var tmp = document.createElement('DIV');
				tmp.innerHTML = articleTitle;
				articleTitlePlain = tmp.textContent || tmp.innerText || "";
				// Description
				// pageDescription = article.title;
			}
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName && articleTitlePlain){
				pageTitle = journalName + ' | ' + articleTitlePlain + ' - Full Text';
			}

			// SEO.set({
			// 	title: pageTitle,
			// 	meta: {
			// 		'description': pageDescription
			// 	},
			// 	og: {
			// 		'title': pageTitle,
			// 		'description': pageDescription
			// 	}
			// });
			// SEO.set({
			// 	title: pageTitle
			// });
		}
	});
	Router.route('/article/:_id/purchase', {
		name: 'PurchaseArticle',
		layoutTemplate: 'Visitor',
		waitOn: function(){
			return[
				Meteor.subscribe('articleInfo',this.params._id)
			]
		},
		data: function(){
			if(this.ready()){
				var id = this.params._id;
				Session.set('article-id',this.params._id);
				var article = articles.findOne({'_id': id});
				return {
					article: article,
				};
			}
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName,
				id,
				article,
				articleTitlePlain,
				articleTitle;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			article = articles.findOne({'_id': id});
			if(article){
				// Title
				articleTitle = article.title
				var tmp = document.createElement('DIV');
				tmp.innerHTML = articleTitle;
				articleTitlePlain = tmp.textContent || tmp.innerText || "";
				// Description
				// pageDescription = article.title;
			}
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName && articleTitlePlain){
				pageTitle = journalName + ' | ' + articleTitlePlain + ' - Purchase';
			}

			// SEO.set({
			// 	title: pageTitle,
			// 	meta: {
			// 		'description': pageDescription
			// 	},
			// 	og: {
			// 		'title': pageTitle,
			// 		'description': pageDescription
			// 	}
			// });
			// SEO.set({
			// 	title: pageTitle
			// });
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
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Recommend';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
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
		},
		onAfterAction: function() {
			var pageTitle,
				pageDescription,
				journal,
				journalName;

			id = this.params._id;
			journalSettings = journalConfig.findOne();
			if(journalSettings){
				journalName = journalSettings.journal.name;
			}
			if(journalName){
				pageTitle = journalName + ' | Subscribe';
			}

			// SEO.set({
			// 	title: pageTitle
			// });
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

	// Recommendations
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

	// Data submissions
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
				Meteor.subscribe('volumes'),
				Meteor.subscribe('articleTypes')
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

	// Intake
	// xml uploading
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

	// Article
	Router.route('/admin/articles',{
		name: 'adminArticlesDashboard',
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('feature'),
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
				var sorted  = sorters.findOne();
				var sortedArticles;
				if(sorted['articles']){
					sortedArticles = sorted['articles'];
				}
				return {
					feature : featureList,
					advance : sortedArticles
				}
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
	});

	// Advance articles
	Router.route('/admin/articles/advance',{
		name: 'AdminAdvanceArticles',
		layoutTemplate: 'Admin',
		waitOn: function(){
			return[
				Meteor.subscribe('advance'),
				Meteor.subscribe('sortedList','advance')
			]
		},
		data: function(){
			if(this.ready()){
				var sorted  = sorters.findOne({name:'advance'});
                var output = [];
                var last_article = {};
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
                        output.push({
                                articles:[],
                                section_name:article.section_name
                            });
                    }
                    output[output.length-1]['articles'].push(article);
                }

				return{
					sections: output
				}
			}
		}
	});

	// Archive
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

	// Issue
	// TODO: LIMIT subscription of articles to just issue
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

	// Users
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
					//,volumes:volumes
					//,issues:issues
				};
			}
		}
	});
	Router.route('/admin/adduser', {
		name: 'AdminAddUser',
		layoutTemplate: 'Admin'
	});

	// Authors
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

	// Institutions
	Router.route('/admin/institution', {
		name: 'AdminInstitution',
		layoutTemplate: 'Admin',
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
		},
		data: function(){
			return {
				institution: institutions.findOne({"_id":this.params._id}),
				updateForm: true
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
