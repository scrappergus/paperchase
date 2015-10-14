Template.AdminArticle.helpers({
	article : function(){
		return Meteor.adminArticle.preProcessArticle();
	}
});
Template.AddArticleDateModal.helpers({
	dates: function(){
		return Meteor.adminArticle.modalDateOrHistory('dates');
	}
});
Template.AddArticleHistoryModal.helpers({
	history: function(){
		return Meteor.adminArticle.modalDateOrHistory('history');
	}
});
Template.AddArticleIdModal.helpers({
	ids: function(){
		var addIds = pubIdTypeList;
		if(Session.get('article')){
			var article = Session.get('article');
			var articleIds = article['ids'];
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
