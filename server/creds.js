Meteor.methods({
    getConfigSiteUrl : function(){
        var siteConfig = journalConfig.findOne({}, {fields: {journal : 1}});
        if(siteConfig){
            return siteConfig['journal']['url'];
        }
    },
    getConfigRecommendationEmail : function(){
        var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recommendation : 1}});
        if(emailConfig){
            return {
                'address' : emailConfig['email_lib_recommendation']['address'].replace('@','%40'),
                'pw' : emailConfig['email_lib_recommendation']['pw']
            };
        }
    },
    getConfigRecommendationEmailAddress : function(){
        var emailConfig = journalConfig.findOne({}, {fields: {email_lib_recommendation : 1}});
        if(emailConfig){
            return emailConfig['email_lib_recommendation']['address']; // do not replace @ here. Email.send does not require encoding
        }
    },
    getConfigSubmission : function(){
        var submissionConfig = journalConfig.findOne({}, {fields: {submission : 1}});
        if(submissionConfig){
            return {
                url: submissionConfig['submission']['url'],
                username: submissionConfig['submission']['user'],
                password: submissionConfig['submission']['pw'],
                cookie : submissionConfig['submission']['cookie']
            }
        }
    },
    getConfigJournal : function(){
        var settings = journalConfig.findOne({}, {fields: {journal : 1}});
        if(settings){
            return settings['journal'];
        }
    },
});