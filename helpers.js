if (Meteor.isClient) {
	Template.registerHelper('pubStatusAbbrev', function (number) {
		if(pubStatusTranslate[parseInt(number - 1)]){
			return pubStatusTranslate[parseInt(number - 1)]['abbrev'];
		}
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
	Template.registerHelper('checked', function(bool) {
		if(bool){
			return 'checked';
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
	Template.registerHelper('equalsArticleId', function(id) {
		if(Session.get('article-id') === id){
			return true;
		}
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
    Template.registerHelper('isSubscribed', function() {
            ip = Meteor.ip.dot2num(headers.getClientIP());

            var match = ipranges.findOne( {
                    startNum: {$lte: ip}
                    ,endNum: {$gte: ip}
                }
            );

            if(match === undefined) {
                userId = Meteor.userId();
                match = Meteor.users.findOne({'_id':userId, subscribed:true});
            }

            return match !== undefined;
	});
    Template.registerHelper('isSubscribedUser', function() {
            userId = Meteor.userId();
            match = Meteor.users.findOne({'_id':userId, subscribed:true});
            return match !== undefined;
	});
	Template.registerHelper('isSubscribedIP', function() {
			ip = Meteor.ipdot2num(headers.getClientIP());

			var match = ipranges.findOne( {
					startNum: {$lte: ip}
					,endNum: {$gte: ip}
				}
			);

			return match !== undefined;
	});
    Template.registerHelper('getInstitutionByIP', function() {
            ip = Meteor.ip.dot2num(headers.getClientIP());

            var match = ipranges.findOne( {
                    startNum: {$lte: ip}
                    ,endNum: {$gte: ip}
                }
            );

            if(match) {
                inst_match = institutions.findOne({
                        "_id": match.institutionID
                    });
            }


            return inst_match || false;
	});

    // Template Helpers
    Template.Visitor.helpers({
    	bannerLogo: function(){
    		var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['journal']['logo']['banner'];
			}
    	},
		submitLink : function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['submission']['url'];
			}
    	}
    });
    Template.Footer.helpers({
		publisher : function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['journal']['publisher']['name'];
			}
		},
		issn : function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['journal']['issn'];
			}
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
    Template.Contact.helpers({
		submitLink : function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['submission']['url'];
			}
		}
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
	Template.EdBoard.helpers({
		journalName: function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['journal']['name'];
			}
		}
	});

	// Admin Template Helpers
	Template.AdminArchive.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {issue:-1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			return res;
		}
	});
	Template.AdminNav.helpers({
		bannerLogo: function(){
			var journalSettings = journalConfig.findOne();
			if(journalSettings){
				return journalSettings['journal']['logo']['banner'];
			}
		}
	});
}

// TODO: Figure out better sorting of issues. They may not have numbers. Right now the issues are sorted by the first page.