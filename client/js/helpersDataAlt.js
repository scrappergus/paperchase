if (Meteor.isClient) {
    // Alt search page
    Template.HeaderAlt.helpers({
        mainColor: function(){
            return '#' + Meteor.settings.public.journal.site.spec.color.main_hex;
        },
        lighterMainColor: function(){
            return '#' + Meteor.settings.public.journal.site.spec.color.lighter_main_hex;
        },
        issn: function(){
            return Meteor.settings.public.journal.issn;
        },
        journal: function(){
            return Meteor.settings.public.journal.name;
        },
        journalShort: function(){
            return Meteor.settings.public.journal.nameShort;
        },
        homeHref: function(){
            return Meteor.settings.public.journal.homeHref;
        },
    });

    Template.HeaderAltSocial.helpers({
        socialList: function(){
            return Meteor.settings.public.journal.site.socialList;
        }
    });

    Template.NavAlt.helpers({
        mainColor: function(){
            return '#' + Meteor.settings.public.journal.site.spec.color.main_hex;
        },
        darkerMainColor: function(){
            return '#' + Meteor.settings.public.journal.site.spec.color.darker_main_hex;
        },
        links: function(){
            return Meteor.settings.public.journal.site.nav;
        },
        contactHref: function(){
            return Meteor.settings.public.journal.site.contactHref;
        },
        journalShort: function(){
            return Meteor.settings.public.journal.nameShort;
        }
    });

    Template.FooterAlt.helpers({
        bgColor: function(){
            return '#' + Meteor.settings.public.journal.site.spec.color.darker_darker_main_hex;
        },
        copyright: function(){
            return Meteor.settings.public.journal.site.copyright;
        }
    });

    Template.SearchAlt.helpers({
        searchLoading: function(){
            return Session.get('searchLoading');
        },
        searchLoaded: function() {
            return Session.get('searchLoaded');
        },
        queryResults: function() {
            return Session.get("queryResults");
        }
    });
}
