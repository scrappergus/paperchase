Meteor.methods({
	getConfigSiteUrl : function(){
		var siteConfig = journalConfig.findOne({}, {fields: {journal : 1}});
		return siteConfig['journal']['url'];
	},
	getConfigRecomendationEmail : function(){
		var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recomendation : 1}});
		return {
			'address' : emailConfig['email_lib_recomendation']['address'].replace('@','%40'),
			'pw' : emailConfig['email_lib_recomendation']['pw']
		};
	},
	getConfigRecomendationEmailAddress : function(){
		var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recomendation : 1}});
		return emailConfig['email_lib_recomendation']['address']; // do not replace @ here. Email.send does not require encoding
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
	getConfigSiteSettings : function(){
		return journalConfig.findOne({}, {fields: {journal : 1}});
	}
});