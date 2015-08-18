if (Meteor.isClient) {
	Template.Archive.helpers({
		volumes: function(){
			var vol = volumes.find({},{sort : {volume:-1}}).fetch();
			var iss = issues.find({},{sort : {page_start:1}}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			// console.log('res = ');console.log(res);
			return res;
		}
	});
}

// TODO: Figure out better sorting of issues. They may not have numbers. Right now the issues are sorted by the first page. 