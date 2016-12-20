Meteor.methods({
        sendEmail: function(args) {
            this.unblock()
            process.env.MAIL_URL = "smtp://postmaster%40smtp.aging-us.com:36f99e4f294ed06076361e4ee2474e68@smtp.mailgun.org:587/";
            Email.send({ 'to' : Meteor.settings.printRequestEmailAddresses,
                    'from' : "postmaster@smtp.aging-us.com",//args.email,                     
                    'subject' : "Request for Reprint",               
                    'html': args.text
                });
        }
    });
