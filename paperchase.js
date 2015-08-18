if (Meteor.isClient) {

    Router.route('/', { 
            name: "home",
            layoutTemplate: 'Visitor'
        });


    Router.route('/archive', { 
            name: "archive",
            layoutTemplate: 'Visitor',
        });

    Router.route('/volume/:volume/issue/:issue', { 
            name: 'issue',
            layoutTemplate: 'Visitor',
            waitOn: function(){
                return[
                    Meteor.subscribe('issues')
                ]
            },
            data: function(){
                if(this.ready()){
                    iss = this.params.issue;
                    vol = this.params.volume;
                    // console.log(vol);console.log(iss);console.log(issues.find().fetch());
                    var issueData = issues.findOne({'issue':iss,'volume':vol});
                    // console.log('issueData');console.log(issueData);
                    return {
                        issue: issueData
                    };
                }
            }
        });


    Router.route('/admin', {
            layoutTemplate: 'admin',
            template: 'archive'
        });


//    Router.route('/', {
//            name: 'home',
//            template: 'home'
//        });


}

if (Meteor.isServer) {
    Meteor.startup(function () {
            // code to run on server at startup
        });
}
