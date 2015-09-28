//AutoForm.setDefaultTemplate('materialize');
//
//AutoForm.hooks({
//  institutionForm: {
//  	beginSubmit: function(){
//	  	Meteor.formActions.saving();
//	},
//	onSuccess: function(formType, result) {
//		Router.go('AdminInstitutionEdit', {_id: result});
//	},
//	onError: function(formType, error) {
//		Meteor.formActions.error();
//		alert(error);
//	}
//  }
//});
