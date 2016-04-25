// Legacy Intake
// ----------------
Template.AdminArticleLegacyIntake.events({
    'click #legacy-update': function(e){
        e.preventDefault();
        Meteor.formActions.saving();
    	var article = Session.get('article-legacy');
    	var articleMongoId;
    	if(article._id){
    		articleMongoId = article._id;
    	}
		Meteor.call('updateArticle', articleMongoId, article, function(error,updatedMongoId){
			if(error){
				console.error(error);
				Meteor.formActions.errorMessage('Could not update the database.<br>' + error.reason);
			}else if(updatedMongoId){
				Meteor.call('sorterAddItem','advance',updatedMongoId,function(error,sorterUpdated){
					if(error){
						Meteor.formActions.errorMessage('Could not update the database');
						console.error(error);
					}else if(sorterUpdated){
						Meteor.formActions.successMessage('Database updated');
					}
				});
			}
		});
    }
});