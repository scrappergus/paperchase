if (Meteor.isClient) {

    Router.route('/', { 
            name: "home",
            layoutTemplate: 'Visitor'
        });


    Router.route('/archive', { 
            name: "archive",
            layoutTemplate: 'Visitor',
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
