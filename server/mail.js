if (Meteor.isServer) {
	emailCreds = new Mongo.Collection('config');
	var creds = emailCreds.findOne({},{'email_lib_recomendation':1});
	var address = creds['email_lib_recomendation']['address'].replace('@','%40');
	var pw = creds['email_lib_recomendation']['pw'];
	process.env.MAIL_URL = 'smtp://' + address +':' + pw + '@smtp.gmail.com:465/';
}