if (Meteor.isClient) {
    Router.route('/admin/article-xml', {
            name: 'admin.article.xml'
            ,layoutTemplate: 'Admin'
            ,waitOn: function(){
                return[
                Meteor.subscribe('xml-intake')
                ]
            }

        });
}
