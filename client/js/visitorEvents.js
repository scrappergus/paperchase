Template.Recommend.events({
	'submit form': function(e,t){
		e.preventDefault();
		Meteor.formActions.saving();
		var inputs = {};
		var errors = [];

		inputs['user_id'] = $('#user_id').val();
		inputs['name_first'] = $('#name_first_input').val();
		inputs['user_email'] = $('#email_input').val();
		inputs['name_last'] = $('#name_last_input').val();
		inputs['institution'] =  $('#institution_input').val();
		inputs['recommendation'] =  $('#recommendation_input').val();

		//check required
		if(!inputs['institution']){
			errors.push('Institution' + ' Required');
			$('#institution_input').addClass('invalid');
		}
		if(!inputs['recommendation']){
			errors.push('Recommendation' + ' Required')
			$('#recommendation_input').addClass('invalid');
		}

		if(errors.length === 0 ){
			//submit form
			Meteor.call('addReccomendation', inputs, function(error,result){
				if(error){
					console.log('ERROR - addReccomendation');
					console.log(error);
				}else{
					Meteor.formActions.success();
				}
			});
		}else{
			//show errors
			Meteor.formActions.error(); //update dom for user
			Session.set('errorMessages',errors); //reactive template variable for ErrorMessages will loop through these
		}
	}
});