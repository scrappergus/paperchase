if (Meteor.isClient) {
	// Forms
	// -------
	Template.registerHelper('checked', function(bool) {
		if(bool){
			return 'checked';
		}
	});
	// Article
	// -------
	Template.registerHelper('articleId', function(){
		return Session.get('article-id');
	})
	Template.registerHelper('getPmid', function(article) {
		// console.log('..getPmid');
		// for references without PMID in XML
		var pmid;
		if(article.title){
			// console.log(article.number + ' = ' +article.title);
			Meteor.call('getPubMedId', article, function(error, pmid){
				if(pmid){
					var fullText = Session.get('article-text');
					var references = fullText.references;
					// Update reference PMID key
					// do not rely on number of reference as index of reference in array.
					for(var ref=0 ; ref<references.length ; ref++){
						if(references[ref].number === article.number){
							fullText.references[ref].pmid = pmid;
							// Update Session variable
							Session.set('article-text',fullText);
						}
					}
				}
			});
		}
	});
	Template.registerHelper('affiliationNumber', function(affiliation) {
		return parseInt(parseInt(affiliation) + 1);
	});
	Template.registerHelper('pubStatusAbbrev', function (number) {
		if(pubStatusTranslate[parseInt(number - 1)]){
			return pubStatusTranslate[parseInt(number - 1)]['abbrev'];
		}
	});
	// Dates
	// -----
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
	Template.registerHelper('inputDate', function(date) {
		return moment(date).format('YYYY/MM/DD');
	});
	Template.registerHelper('formatDate', function(date) {
		return moment(date).format('MMMM D, YYYY');
	});
	Template.registerHelper('formatDateNumber', function(date) {
		return moment(date).format('MM/D/YYYY');
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
	Template.registerHelper('dashedDateToWordDate',function(date) {
		var d = new Date(date);
		return moment(d).format('MMMM D, YYYY');
	});
	// Equals
	// -------
	Template.registerHelper('equals', function (a, b) {
		return a == b;
	});
	Template.registerHelper('equalsArticleId', function(id) {
		if(Session.get('article-id') === id){
			return true;
		}
	});
	Template.registerHelper('editingSection', function (id) {
		// console.log('..editingSection ');
		// for admin editing of for authors
		return id == Session.get('sectionId');
	});
	Template.registerHelper('editingPaperSection', function (id) {
		// for admin editing of section
		return id == Session.get('paperSectionId');
	});
	Template.registerHelper('editingAboutSection', function (id) {
		// for admin editing of about
		return id == Session.get('aboutSectionId');
	});
	// Not equals
	Template.registerHelper('notEmpty', function (a) {
		if(!a){
			return false;
		}else if(a.length > 0){
			return true;
		}else{
			return false;
		}
	});


	// Modify
	// -------
	Template.registerHelper('arrayify',function(obj){
		result = [];
		for (var key in obj) result.push({name:key,value:obj[key]});
		return result;
	});
	Template.registerHelper('countItems', function(items) {
		return items.length;
	});
	// Subscribers
	// -------
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
}