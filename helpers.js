if (Meteor.isClient) {
	Template.Archive.helpers({
		volumes: function(){
			var vol = volumes.find({}).fetch();
			var iss = issues.find({}).fetch();
			var res = Meteor.organize.issuesIntoVolumes(vol,iss);
			// console.log('res = ');console.log(res);
			return res;
		}
	});
}