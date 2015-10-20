if (Meteor.isServer) {
	journalConfig = new Mongo.Collection('config');
	var config = journalConfig.findOne({},{'email_lib_recomendation':1, 'ejp':1});

	// Journal
	journalConfig = config['journal'];

	// DOI
	doiConfig = config['doi'];

	// Library Recommendation Email
	email_lib_recomendation_address = config['email_lib_recomendation']['address']; // this variable is used to send emails in method notifyByEmail()
	var address_encoded = email_lib_recomendation_address.replace('@','%40');
	var pw = config['email_lib_recomendation']['pw'];
	process.env.MAIL_URL = 'smtp://' + address_encoded +':' + pw + '@smtp.gmail.com:465/';

	// EJP
	ejpConfig = {
		url: config['ejp']['url'],
		username: config['ejp']['user'],
		password: config['ejp']['pw'],
		cookie : config['ejp']['cookie']
	}
}