Meteor.methods({
	getConfigSiteUrl : function(){
		var siteConfig = journalConfig.findOne({}, {fields: {journal : 1}});
		return siteConfig['journal']['url'];
	},
	getConfigRecommendationEmail : function(){
		var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recommendation : 1}});
		return {
			'address' : emailConfig['email_lib_recommendation']['address'].replace('@','%40'),
			'pw' : emailConfig['email_lib_recommendation']['pw']
		};
	},
	getConfigRecommendationEmailAddress : function(){
		var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recommendation : 1}});
		return emailConfig['email_lib_recommendation']['address']; // do not replace @ here. Email.send does not require encoding
	},
	getConfigEjp : function(){
		var ejpConfig = journalConfig.findOne({}, {fields: {ejp : 1}});
		return {
			url: config['ejp']['url'],
			username: config['ejp']['user'],
			password: config['ejp']['pw'],
			cookie : config['ejp']['cookie']
		}
	},
	getConfigJournal : function(){
		var settings = journalConfig.findOne({}, {fields: {journal : 1}});
		return settings['journal'];
	},
});