// Temporary Code
// --------------

// Page Title
// Using this until SEO package version conflict is fixed
if (Meteor.isClient) {
	Deps.autorun(function(){
		document.title = 'Oncotarget';
	});
}