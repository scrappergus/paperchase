Meteor.organize = {
	issuesIntoVolumes: function(vol,iss){
		// console.log('-issuesIntoVolumes');
		// console.log('vol');console.log(vol);console.log('iss');console.log(iss);
		
		var issL = iss.length;

		//group issues by volume
		var issues = []
		for(var i = 0; i < iss.length ; i++){
			var issue = iss[i];
			if(!issues[issue['volume']]){
				issues[issue['volume']] = [];
			}
			issues[issue['volume']].push(issue);
		}

		//loop through volumes to add issues. this will keep the order descending so that the most recent vol is at the top
		var volL = vol.length;
		for(var idx = 0; idx < volL ; idx++){
			vol[idx]['issues'] = issues[vol[idx]['volume']];
		}
		return vol;
	}
}