if (Meteor.isClient) {
	Template.registerHelper('pubStatusAbbrev', function (number) {
		return pubStatusTranslate[parseInt(number - 1)]['abbrev'];
	});
	Template.registerHelper('getMonthWord', function(month) {
		var d = new Date(month);
		var month = new Array();
		month[0] = 'January';
		month[1] = 'February';
		month[2] = 'March';
		month[3] = 'April';
		month[4] = 'May';
		month[5] = 'June';
		month[6] = 'July';
		month[7] = 'August';
		month[8] = 'September';
		month[9] = 'October';
		month[10] = 'November';
		month[11] = 'December';
		return month[d.getMonth()];
	});
	Template.registerHelper('dateDayExists',function(date){
		//if the date object should have a day value associated with it
		if(moment(date).format('HH') == 00){
			return true;
		}else{
			return false;
		}
	});
	Template.registerHelper('placeholderDate',function(date){
		if(moment(date).format('HH') == 00){
			return moment(date).format('M D, YYYY');;
		}else{
			return moment(date).format('M YYYY');;
		}
	});
	Template.registerHelper('inputDate', function(date) {
		return moment(date).format('YYYY/MM/DD');
	});
	Template.registerHelper('formatDate', function(date) {
		return moment(date).format('MMMM D, YYYY');
	});
	Template.registerHelper('formatDateNumber', function(date) {
		return moment(date).format('MM/D/YYYY');
	});
	Template.registerHelper('affiliationNumber', function(affiliation) {
		return parseInt(parseInt(affiliation) + 1);
	});
	Template.registerHelper('formatIssueDate', function(date) {
		return moment(date).format('MMMM YYYY');
	});
	Template.registerHelper('articleDate', function(date) {
		return moment(date).format('MMMM D, YYYY');
	});
	Template.registerHelper('collectionDate',function(date) {
		return moment(date).format('MMMM YYYY');
	});
	Template.registerHelper('getYear',function(date) {
		return moment(date).format('YYYY');
	});
	Template.registerHelper('getMonth',function(date) {
		return moment(date).format('MMMM');
	});
	Template.registerHelper('getDay',function(date) {
		return moment(date).format('D');
	});
	Template.registerHelper('equals', function (a, b) {
		return a == b;
	});
	Template.registerHelper('arrayify',function(obj){
		result = [];
		for (var key in obj) result.push({name:key,value:obj[key]});
		return result;
	});
	Template.registerHelper('countItems', function(items) {
		return items.length;
	});
	Template.registerHelper('clientIP', function() {
			return headers.getClientIP();
		 });


	Template.ErrorMessages.helpers({
		errors: function(){
			return Session.get('errorMessages');
		}
	});
	Template.SubscribeModal.helpers({
		article: function(){
			return Session.get('articleData');
		}
	});
	Template.Archive.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {issue:-1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			return res;
		}
	});
	Template.AdminArchive.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {issue:-1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			return res;
		}
	});
	Template.Home.helpers({
		cards: function(){
			var cards = [
				{
					'name' : 'Gerotarget',
					'src' : '1.jpg'
				},
				{
					'name' : 'Pathology',
					'src' : '2.jpg'
				},
				{
					'name' : 'Bioinformatics',
					'src' : '3.jpg'
				},
				{
					'name' : 'Pharmacology',
					'src' : '4.jpg'
				},
				{
					'name' : 'Stem Cell',
					'src' : '5.jpg'
				},
				{
					'name' : 'miRNA',
					'src' : '6.jpg'
				},
				{
					'name' : 'Immunology',
					'src' : '7.jpg'
				},
				{
					'name' : 'Neurobiology',
					'src' : '8.jpg'
				},
				{
					'name' : 'Cellular & Molecular Biology',
					'src' : '9.jpg'
				}
			];
			return cards;
		}
	});

	/*
	Admin
	*/
	// pubTypeDateList, dateTypeDateList and pubIdTypeList: http://jats.nlm.nih.gov/archiving/tag-library/1.0/index.html
	var pubTypeDateList = {
		'collection': 'Collection',
		'epub': 'Electronic publication (usually web, but also includes eBook, CD-ROM, or other electronic-only distribution)',
		'ppub': 'Print publication',
		'epub-ppub': 'Both print and electronic publications',
		'epreprint': 'Electronic preprint dissemination',
		'ppreprint': 'Print preprint dissemination',
		'ecorrected': 'Corrected in electronic',
		'pcorrected': 'Corrected in print',
		'eretracted': 'Retracted in electronic',
		'pretracted': 'Retracted in print',
	};
	var dateTypeDateList = {
		'accepted': 'The date a document, typically a manuscript, was accepted',
		'corrected': 'The date an article was corrected',
		'pub' : 'The publication date (electronic or print)',
		'preprint':'Preprint dissemination date (electronic or print)',
		'retracted': 'The date an article was retracted',
		'received':'The date a document, typically a manuscript, was received',
		'rev-recd':'The date a revised document was received',
		'rev-request':'The date revisions were requested'
	};
	var pubIdTypeList = {
		'aggregator': 'Identifier assigned by a data aggregator',
		'archive':'Identifier assigned by an archive or other repository',
		'art-access-id':'Generic article accession identifier for interchange and retrieval between archives',
		'arxiv':'arXiv archive of electronic preprints',
		'coden':'Obsolete PDB/CCDC identifier (may be present on older articles)',
		'doaj':'Directory of Open Access Journals',
		'doi':'Digital Object Identifier',
		'index':'Identifier assigned by an abstracting or indexing service (generally used with elements <object-id>, <issue-id>, and <volume-id>)',
		'isbn':'International Standard Book Number',
		'manuscript':'Identifier assigned to a manuscript',
		'medline':'NLM Medline identifier',
		'pii':'Publisher Item Identifier',
		'pmcid':'PubMed Central identifier',
		'pmid':'PubMed ID',
		'publisher-id':'Publisher’s identifier',
		'sici':'Serial Item and Contribution Identifier',
		'std-designation':'The official number of a standard, from a standards body such as ISO, NISO, IEEE, ASME'
	}
	Template.AdminArticle.helpers({
		article : function(){
			return Meteor.adminArticle.preProcessArticle();
		}
	});
	Template.AddArticleDateModal.helpers({
		dates: function(){
			var addDates = pubTypeDateList;
			if(Session.get('article')){
				var articleDates = Session.get('article').dates;
				// console.log(articleDates);
				for(var d in articleDates){
					delete addDates[d];
				}
				return addDates;
			}
		}
	});
	Template.AddArticleHistoryModal.helpers({
		history: function(){
			var addDates = dateTypeDateList;
			if(Session.get('article')){
				var articleHistory = Session.get('article').history;
				// console.log(articleDates);
				for(var d in articleHistory){
					delete addDates[d];
				}
				return addDates;
			}
		}
	});
	Template.AddArticleIdModal.helpers({
		ids: function(){
			var addIds = pubIdTypeList;
			if(Session.get('article')){
				var articleIds = Session.get('ids');
				// console.log(articleDates);
				for(var d in articleIds){
					delete addIds[d];
				}
				return addIds;
			}
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
	Template.AdminDataSubmissions.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {issue:-1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			return res;
		},
		articles: function(){
			// console.log( Session.get('submission_list'));
			return Session.get('submission_list');
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
	Template.AdminInstitutionForm.helpers({
		'showIPFields' : function(){
			return Template.instance().showIPFields.get();
		}
	});
	Template.adminArticleXmlIntake.helpers({
		myCallbacks: function() {
			return {
				finished: function(index, fileInfo, context) {
					Session.set('fileNameXML',fileInfo.name);
					Router.go('adminArticleXmlProcess');
				}
			}
		}
	});

	Template.AdminUserSubs.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {issue:-1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			return res;
		}
	});

}

// TODO: Figure out better sorting of issues. They may not have numbers. Right now the issues are sorted by the first page.
