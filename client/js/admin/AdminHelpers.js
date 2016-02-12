// ADMIN HELPERS

Template.AdminNav.helpers({
	mainColor: function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['site']['spec']['color']['main_rgb'];
		}
	},
});
// Site Control
// ---------------
Template.AdminSiteControl.helpers({
	sideNav: function(){
		if(Session.get('journal')){
			return Session.get('journal').site.side_nav;
		}
	}
});


// DOI Status
// ---------------
Template.AdminDoiStatus.helpers({
	articlesList: function(){
		return Session.get('articles-doi-status');
	},
	settings: function(){
		return {
			rowsPerPage: 50,
			filters: ['piiFilter'],
			fields: [
				{
					key: 'paperchase.ids.pii',
					label: 'PII',
					fn: function(pii){
						return pii;
					}
				},
				{
					key: 'doi',
					label: 'DOI'
				},
				{
					key: 'deposited',
					label: 'Deposited',
					fn: function(deposited){
						if(deposited){
							return Meteor.dates.wordDate(deposited.timestamp);
						}
					}
				},
				{
					key: 'indexed_date',
					label: 'Indexed',
					fn: function(indexed_date){
						if(indexed_date){
							return Meteor.dates.wordDate(indexed_date);
						}
					}
				},
				{
					key: 'registered',
					label: 'Registered'
				},
				{
					key: 'paperchase',
					label: '',
					fn: function(paperchase){
						if(paperchase.ids.pii && paperchase.dates &&  paperchase.dates.epub){
							var epubTimestamp = paperchase.dates.epub;
								epubTimestamp = new Date(epubTimestamp);
								epubTimestamp =	epubTimestamp.getTime();
							return new Spacebars.SafeString('<a class="btn btn-sm" href="' + paperchase.doiRegisterUrl + paperchase.ids.pii + '?epub=' + epubTimestamp + '">Register</a>');
						}else{
							return '';
						}
					}
				},
				{
					key: 'crossref_print_date',
					label: 'DOI: Print',
					fn: function(date){
						if(date){
							return Meteor.dates.dashedToWord(date);
						}else{
							return '';
						}
					}
				},
				{
					key: 'crossref_epub_date',
					label: 'DOI: EPub',
					fn: function(date){
						if(date){
							return Meteor.dates.dashedToWord(date);
						}else{
							return '';
						}
					}
				},
				{
					key: 'paperchase',
					label: 'EPub',
					fn: function(paperchase){
						if(paperchase.dates &&  paperchase.dates.epub){
							return Meteor.dates.article(paperchase.dates.epub);
						}else{
							return '';
						}
					},
					cellClass: function (value, object) {
						if(object.crossref_epub_date){
							if(object.paperchase.dates && object.paperchase.dates.epub){
								if(Meteor.dates.dashedToWord(object.crossref_epub_date)  !=  Meteor.dates.article(object.paperchase.dates.epub)){
									return 'article-date-conflict';
								}
							}
						}
					}
				},
				{
					key: 'paperchase',
					label: 'PMC',
					fn: function(paperchase){
						if(paperchase.ids &&  paperchase.ids.pmc){
							return new Spacebars.SafeString('<a target="_BLANK" href="http://www.ncbi.nlm.nih.gov/pmc/' + paperchase.ids.pmc + '">PMC</a>');
						}else{
							return '';
						}
					}
				},
				{
					key: 'paperchase',
					label: 'PubMed',
					fn: function(paperchase){
						if(paperchase.ids &&  paperchase.ids.pmid){
							return new Spacebars.SafeString('<a target="_BLANK" href="http://www.ncbi.nlm.nih.gov/pubmed/' + paperchase.ids.pmid + '">PubMed</a>');
						}else{
							return '';
						}
					}
				},
				{
					key: 'paperchase',
					label: '',
					fn: function(paperchase){
						return new Spacebars.SafeString('<a href="/admin/article/' + paperchase._id + '">View</a>');
					}
				}
			]
		}
	}
})

// Article
// ---------------
Template.AdminArticleOverview.helpers({
	article : function(){
		return Session.get('article');
	}
});
Template.AdminArticle.helpers({
	articleProcessed: function(){
		// session default for article is null. If new article, empty object.
		if(Session.get('article') === null){
			return false;
		}else{
			return true;
		}
	}
});
Template.AdminArticleAdd.helpers({
	articleProcessed: function(){
		// session default for article is null. If new article, empty object.
		if(Session.get('article') === null){
			return false;
		}else{
			return true;
		}
	}
});
Template.AdminArticleForm.helpers({
	article : function(){
		return Session.get('article');
	}
});
Template.AddArticleDate.helpers({
	dates: function(){
		return Meteor.adminArticle.articleListOptions('dates');
	}
});
Template.AddArticleHistory.helpers({
	history: function(){
		return Meteor.adminArticle.articleListOptions('history');
	}
});
Template.AddArticleId.helpers({
	ids: function(){
		return Meteor.adminArticle.articleListOptions('ids');
	}
});
Template.AdminArticlesList.helpers({
	settings: function(){
		return {
			rowsPerPage: 10,
			showFilter: false,
			fields: [
				{
					key: 'title',
					label: 'Title',
					fn: function(title){
						var t = Meteor.admin.titleInTable(title);
						return new Spacebars.SafeString(t);
					}
				},
				{
					key: 'volume',
					label: 'Volume'
				},
				{
					key: 'issue',
					label: 'Issue'
				},
				{
					key: 'ids.pii',
					label: 'PII'
				},
				{
					key: 'dates.epub',
					label: 'EPub',
					fn: function(date){
						if(date){
							return Meteor.dates.article(date);
						}else{
							return '';
						}
					}
				},
				{
					key: '_id',
					label: '',
					sortable: false,
					fn: function(value){
						return new Spacebars.SafeString('<a href="/admin/article/' + value + '">View</a>');
					}
				}
			]
		}
	}
});

// Upload
// XML
// ---------------
Template.AdminArticleXmlUpload.helpers({
	uploaded: function(){
		return Session.get('xml-uploaded');
	},
	articleProcessed: function(){
		return Session.get('article');
	}
});

// Data Submission
// ---------------
Template.AdminDataSubmissions.helpers({
	volumes: function(){
		return Session.get('archive');
	},
	articles: function(){
		// console.log('..Articles helper');
		var articlesList = articles.find().fetch();
		if(articlesList){
			Meteor.dataSubmissions.doneProcessing();
			return articlesList;
		}
	},
	error: function(){
		return Session.get('error');
	},
	missingPii: function(){
		return Session.get('missingPii');
	}
});
Template.AdminDataSubmissionsPast.helpers({
	submissionsSettings: function(){
		return {
			rowsPerPage: 10,
			showFilter: false,
			fields: [
				{
					key: 'created_date',
					label: 'Date',
					fn: function(d){
						return moment(d).format('MM/D/YYYY')
					}
				},
				{
					key: 'created_by',
					label: 'Created By',
					fn: function(uId){
						var u = Meteor.users.findOne({'_id':uId},{'name_first': 1, 'name_last':1});
						return u['name_first'] + ' ' + u['name_last'];
					}
				},
				{
					key: 'file_name',
					label: 'File'
				}
			]
		}
	},
	articleSettings: function () {
		return {
			collection: articles.find().fetch(),
			rowsPerPage: 10,
			showFilter: false,
			fields: [
				{
					key: 'title',
					label: 'Title',
					fn: function(title){
							// var txt = document.createElement('textarea');
							// txt.innerHTML = title.substring(0,40);
							// if(title.length > 40){
							// 	txt.innerHTML += '...';
							// }
						var t = Meteor.admin.titleInTable(title);
						return new Spacebars.SafeString(t);
					}
				},
				{
					key: 'ids.pii',
					label: 'PII'
				},
				{
					key: 'ids.pmid',
					label: 'PubMed ID'
				},
				{
					key: 'ids.pmc',
					label: 'PMC ID'
				},
				{
					key: 'pub_status',
					label: 'Pub Status',
					fn: function(value){
						var stat = 'unknown';
						if(pubStatusTranslate[parseInt(value - 1)]){
							stat = pubStatusTranslate[parseInt(value - 1)]['abbrev'];
						}
						return stat;
					}
				},
				{
					key: 'submissions',
					label: 'Last Submission',
					fn: function(submissions){
						if(submissions){
							var d = submissions[submissions.length - 1]['created_date'];
							d = moment(d).format('MM/D/YYYY');
							return d;
						}
					}
				}
			]
		};
	}
})

// Institution
// ---------------
Template.AdminInstitutionForm.helpers({
	'showIPFields' : function(){
		return Template.instance().showIPFields.get();
	}
});

// For Authors
// ---------------
Template.AdminForAuthors.helpers({
	'showForm' : function(){
		return Session.get('showForm');
	}
});
Template.AdminForAuthorsForm.helpers({
	'section' : function(){
		var section = {};
		if(Session.get('sectionId')){
			section = forAuthors.findOne({_id : Session.get('sectionId')});
		}
		return section;
	}
});

// About
// ---------------
Template.AdminAbout.helpers({
	'showAboutForm' : function(){
		return Session.get('showAboutForm');
	}
});
Template.AdminAboutForm.helpers({
	'section' : function(){
		var section = {};
		if(Session.get('aboutSectionId')){
			section = about.findOne({_id : Session.get('aboutSectionId')});
		}
		return section;
	}
});

// Upload
// ---------------
Template.s3Upload.helpers({
	'files': function(){
		// console.log(S3.collection.find());
		return S3.collection.find();
	}
});

// News
// ---------------
Template.AdminNews.helpers({
	news: function() {
		return newsList.find({display:true},{sort:{date:-1}});
	}
});
Template.AdminNewsForm.helpers({
	news: function() {
		var news = {}; // if undefined, the template form will not load. So we need an empty object.
		if(Session.get('newsId')){
			news = newsList.findOne({_id : Session.get('newsId')});
		}
		return news;
	}
});

// Users
// ---------------
Template.AdminUserSubs.helpers({
	volumes: function(){
		return Session.get('archive');
	}
});

// Archive
// ---------------
Template.AdminArchive.helpers({
	volumes: function(){
		return Session.get('archive');
	}
});

// Volume
// ---------------
Template.AdminVolume.helpers({
	volume: function(){
		return Session.get('volume');
	}
});

// Issue
// ---------------
Template.AdminIssue.helpers({
	issueData: function(){
		return Session.get('issue');
	}
});

// General
// ---------------
Template.AdminNav.helpers({
	bannerLogo: function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['journal']['logo']['banner'];
		}
	}
});


// Sections
// ---------------
Template.AdminSections.helpers({
	sections: function(){
		return sections.find({},{sort : {name:1}}).fetch();
	}
});
Template.AdminSectionsForm.helpers({
	section: function() {
		var section = {}; // if undefined, the template form will not load. So we need an empty object.
		if(Session.get('paperSectionId')){
			section = sections.findOne({_id : Session.get('paperSectionId')});
		}
		return section;
	}
});
Template.AdminSectionPapers.helpers({
	section: function(){
		return sections.findOne({_id : Session.get('paperSectionId')});
	},
	papers: function() {
		return articles.find().fetch(); // subscription is limited to just these section papers, so we can return the whole collection
	}
});

// Audit
// ---------------
Template.AdminArticlesAudit.helpers({
	duplicates: function(){
		return  Session.get('articles-duplicate');
	}
});
Template.AdminArticlesAuditContent.helpers({
	paperchaseAudit: function(){
		return  Session.get('articles-assets-audit');
	},
	ncbiAudit: function(){
		return  Session.get('articles-ncbi-audit');
	}
});

// Advance
// ---------------
Template.AdminAdvanceArticles.helpers({
	sections: function(){
		return  Session.get('advanceAdmin');
	},
	statusAction: function(){
		return Session.get('statusModalAction');
	},
	modalMessage: function(){
		return  Session.get('modalMessage');
	}
});
