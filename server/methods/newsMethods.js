Meteor.methods({
	addNews: function(data){
		return success = newsList.insert(data);;
	},
	updateNews: function(mongoId, data){
		// console.log('updateNews',mongoId,data);
		return newsList.update({_id : mongoId} , {$set: data});
	},
	realYouTubeVideo: function(videoId){
		// to check if YouTube ID is an actual video
		if(videoId){
			var fut = new future();
			var url = 'https://www.youtube.com/watch?v=' + videoId;
			Meteor.http.get(url, function(error,result){
				if(error){
					fut['throw'](error);
					// throw new Meteor.Error(503, 'ERROR: YouTube Video Check' , error);
				}else if(result){
					fut['return'](true);
				}
			});

			return fut.wait();
		}else{
			return true;
		}
	}
});