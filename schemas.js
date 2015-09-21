var Schemas = {};


/*
Institutions
*/
Schemas.Institutions = new SimpleSchema({
    institution: {
        type: String,
        label: "Institution",
        max: 200
    },
    address: {
        type: String
        ,label: "Address"
        ,max: 200
        ,optional:true
        ,autoform: {
            rows: 5
        }
    },
    IPRanges: {
        type: Array,
        label: "IP Ranges",
        optional: true,
        minCount: 0,
        maxCount: 20
    },
    "IPRanges.$": {
        type: Object,
    },
    "IPRanges.$.startIP": {
        type: String,
        label: 'Start IP'
    },
    "IPRanges.$.endIP": {
        type: String,
        label: 'End IP'
    }
});

Schemas.IPRanges = new SimpleSchema({
    institutionID: {
        type: String,
        max: 200
    },
    "startIP": {
        type: String 
    },
    "endIP": {
        type: String
    },
    "startNum": {
        type: Number
    },
    "endNum": {
        type: Number
    }

});


Schemas.users = new SimpleSchema({
    institution: {
        type: String,
        label: "Institution",
        max: 200
    },
    address: {
        type: String
        ,label: "Address"
        ,max: 200
        ,optional:true
        ,autoform: {
            rows: 5
        }
    },
    IPRanges: {
        type: Array,
        label: "IP Ranges",
        optional: true,
        minCount: 0,
        maxCount: 20
    },
    "IPRanges.$": {
        type: Object
    },
    "IPRanges.$.startIP": {
        type: String 
    },
    "IPRanges.$.endIP": {
        type: String
    }
});

IPRanges.attachSchema(Schemas.IPRanges);
Institutions.attachSchema(Schemas.Institutions);

/*
Users
*/
Schemas.UserCountry = new SimpleSchema({
    name: {
        type: String
    },
    code: {
        type: String,
        regEx: /^[A-Z]{2}$/
    }
});

Schemas.UserProfile = new SimpleSchema({
    firstName: {
        type: String,
        regEx: /^[a-zA-Z-]{2,25}$/,
        optional: true
    },
    lastName: {
        type: String,
        regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
    },
    birthday: {
        type: Date,
        optional: true
    },
    gender: {
        type: String,
        allowedValues: ['Male', 'Female'],
        optional: true
    },
    organization : {
        type: String,
        regEx: /^[a-z0-9A-z .]{3,30}$/,
        optional: true
    },
    website: {
        type: String,
        regEx: SimpleSchema.RegEx.Url,
        optional: true
    },
    bio: {
        type: String,
        optional: true
    },
    country: {
        type: Schemas.UserCountry,
        optional: true
    }
});

Schemas.User = new SimpleSchema({
    username: {
        type: String,
        regEx: /^[a-z0-9A-Z_]{3,15}$/,
        optional: true
    },
    emails: {
        type: [Object],
        // this must be optional if you also use other login services like facebook,
        // but if you use only accounts-password, then it can be required
        optional: true
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    createdAt: {
        type: Date
    },
    profile: {
        type: Schemas.UserProfile,
        optional: true
    },
    // Make sure this services field is in your schema if you're using any of the accounts packages
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    // Add `roles` to your schema if you use the meteor-roles package.
    // Option 1: Object type
    // If you specify that type as Object, you must also specify the
    // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
    // Example:
    // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
    // You can't mix and match adding with and without a group since
    // you will fail validation in some cases.
    roles: {
        type: Object,
        optional: true,
        blackbox: true
    },
    status: {
              type: Object,
              optional: true,
              blackbox: true
          }
});

Meteor.users.attachSchema(Schemas.User);


XMLIntake = new Meteor.Collection('xml-intake');

Schemas.XMLIntake = new SimpleSchema ({
        picture: {
            type: String
            ,autoform: {
                afFieldInput: {
                    type: 'fileUpload'
                    ,collection: 'xml-intake-fs'
                }
                ,label: 'Choose file' 
            }
        }
    });

/*
Articles
*/
Schemas.articles = new SimpleSchema({
    title: {
        type: String,
        optional: false
    },
    authors: {
        type: Array
    },
    'authors.$':{
        type: Object
    },
    'authors.$.name_first': {
        type: String
    },
    'authors.$.name_last': {
        type: String
    },
    page_start: {
        type: Number
    },
    page_end: {
        type: Number
    },
    volume: {
        type: Number
    },
    issue: {
        type: Number
    },
    issue_id:{
        type: String
    },
    keywords: {
        type: Array
    },
    'keywords.$':{
        type: String
    },
    ids: {
        type: Object
    },
    dates: {
        type: Array
    },
    'dates.$':{
        type: Object
    },
    'dates.$.type': {
        type: String
    },
    'dates.$.month': {
        type: Number
    },
    'dates.$.day': {
        type: Number
    },
    'dates.$.year': {
        type: Number
    },
    history: {
        type: Array
    },
    'history.$':{
        type: Object
    },
    'history.$.type': {
        type: String
    },
    'history.$.month': {
        type: Number
    },
    'history.$.day': {
        type: Number
    },
    'history.$.year': {
        type: Number
    },
    'feature':{
        type: Boolean
    },
    'advance':{
        type: Boolean
    },
    'abstract' : {
        type: String
    },
    doc_updates: {
        type: Object
    }
});


/*
Issues
*/
Schemas.issues = new SimpleSchema({
    issue:{
        type: Number
    },
    volume:{
        type: Number
    },
    page_start:{
        type: Number
    },
    page_end:{
        type: Number
    },
    pub_date: {
        type: Date
    },
    doc_updates: {
        type: Object
    }
});
Schemas.volumes = new SimpleSchema({
    volume:{
        type: Number
    },
    releases:{
        type: String
    },
    year:{
        type: Number
    }
});