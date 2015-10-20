if (Meteor.isServer) {
	config = new Mongo.Collection('config');

	// Library Recommendation Email
	var creds = config.findOne({},{'email_lib_recomendation':1, 'ejp':1});
	var address = creds['email_lib_recomendation']['address'].replace('@','%40');
	var pw = creds['email_lib_recomendation']['pw'];
	process.env.MAIL_URL = 'smtp://' + address +':' + pw + '@smtp.gmail.com:465/';

	// EJP
	ejpCred = {
		url: creds['ejp']['url'],
		username: creds['ejp']['user'],
		password: creds['ejp']['pw']
	}
}