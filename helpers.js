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
							var txt = document.createElement('textarea');
							txt.innerHTML = title.substring(0,40);
							if(title.length > 40){
								txt.innerHTML += '...';
							}
							return new Spacebars.SafeString(txt.value);
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
