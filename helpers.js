if (Meteor.isClient) {
    Template.registerHelper('clientIP', function() {
            return headers.getClientIP();
        });

    Template.registerHelper('isSubscribedIP', function() {
            ip = dot2num(headers.getClientIP());

            var match = IPRanges.findOne( { 
                    startNum: {$lte: ip} 
                    ,endNum: {$gte: ip}
                }
            );

            return match !== undefined;
        });

    Template.registerHelper('getInstitutionByIP', function() {
            ip = dot2num(headers.getClientIP());

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

	Template.Archive.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {page_start:1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			// console.log('res = ');console.log(res);
			return res;
		}
	});

	/*
	Admin
	*/
    Template.AdminInstitution.helpers({
            'institutions': function() {
                return Institutions.find({});
            }
        });
}

// TODO: Figure out better sorting of issues. They may not have numbers. Right now the issues are sorted by the first page. 