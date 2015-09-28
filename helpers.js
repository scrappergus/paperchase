if (Meteor.isClient) {
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
		return moment(date).format('MMMM DD, YYYY');
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


<<<<<<< HEAD
			var match = IPRanges.findOne( {
					startNum: {$lte: ip}
					,endNum: {$gte: ip}
				}
			);

			return match !== undefined;
		});
=======
>>>>>>> 45a54664cf97621654fda07963906d5603135fe6


<<<<<<< HEAD
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

	Template.archive.helpers({
=======
	Template.Archive.helpers({
>>>>>>> 45a54664cf97621654fda07963906d5603135fe6
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
}

// TODO: Figure out better sorting of issues. They may not have numbers. Right now the issues are sorted by the first page.
