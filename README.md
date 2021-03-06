**Paperchase Documentation**
========================
An academic journal platform.

App Structure
============
 - **/:** for client and server side. Some of these files will have checks for where on app part of file can be used, for ex: if `(Meteor.isClient) {}`
 - **/client:** for client side
 - **/js:** for client and server side
 - **/server:** for server side
 - **/templates:** client and admin templates
 - **/public:** static assets. (journal images, not article images)


Template Data
============
When possible, use helper files to pass data to template: `AdminHelpers.js` and `helpersData.js`

Data
============
Meteor.article.readyData() should be used before viewing article DB data

Deploy
============
 - change favicon to journal deploying (all journal favicons located in /public)
 - change settins.json
 - change /server/awsConfig.js
 -

Visitor Site
============

 - LoadingConfig template only used while config collection loads
 - config collection contains journal specific variables - main color, journal
   name, submit link etc.
 - Template variable `configLoaded` is used to show/hide visitor layout until collection is loaded.

Navigation
----------
In nav.html, the main side nav and the mobile collapsible nav will list only section links that are set to display:true and these links are listed in the order saved on Site Control

----------


Admin Site
==========

Admin permissions are tested on the admin parent template.

`<template name="Admin">
{{#if isInRole 'admin'}}
</template>`


404 and Loading
Cannot use the same template variable to determine to show 404 message or loading. There is a global variable, admin-not-found, which gets set in the router (the article routes use Meteor.adminArticle.urlViaPiiOrMongo()) and is used to determine whether to show 404 message. Loading template is shown when template variable with page data is null.


Data Submissions
------------
/admin/data-submissions
Create submission set based on PII list or Issue. Uses subscription to submissionSet, which will either query for issue_id or list of PII. Two reactive template variables are passed to the subscription, queryType and queryParams. The type will determine if issue or PII search. The params will be either issue_id or array of PII. Before subscribing, if queryType = reset, then clear the template variable using the reset function Meteor.dataSubmissions.resetPage(). The results are pulled directly from the subscribed collection, with data processed before passing to the template.

XML sets saved on s3 in pubmed_xml_sets.

Only uses with super-admin or data-submissions roles can access.


Site Control
------------
/admin/site-control
Admin control of side navigation (main page navigation and section page navigation). Options are stored as objects in an array in the config doc in DB.  Order of objects in array determines order of links listed.

    "site" : {
	    "side_nav" : [
	    {
		    "route_name" : "advance",
		    "name" : "Advance",
		    "display" : true
	    }
	}

**Display & Order**
Main page nav - display and order is stored in config collection.
Section side nav - display stored in sections collection. order stored in sorters collection.

News
----
Stored in the news collection. Doc contains - title, content, date, display, and also updates by users are tracked (just user id and date).
Session variable `newsId` used in news form helper.

**Database Publications**
newsListAll: For admin only. doesn't limit news items not displayed to public
newsListDisplay: Only news items to display to public
newsItem: Publication by Mongo ID

Section Pages
-------------

**Admin Control**
Create new sections, assign articles to sections, display section links in side nav, order of links in side nav.

**Updating**
Section Name & Display
Whenever the section doc is updated, the doc for the order of sections also gets updated.

**Section Papers Page**
List of articles comes from session variable article-list.
Session variable article-list is set in the router, onBeforeAction. Preprocessing of the list occurs in the server method preprocessSectionArticles to retrieve URLs of assets (PDFs, Figures, etc) for showing buttons.

**Add New Section**
/admin/sections-add

**All Sections**
/admin/sections
A table with: Section Name, Hidden/Display, Papers (link to papers table), Edit
Can edit 1 section at a time on this page (same form as add new section)
List sorted alphabetically (though sorters collection is used on side nav, so we can change this based on section order)

**Sections Link Order**
/admin/site-control
Order saved in sorters collection. List name = sections
Hidden links not listed
Can also hide sections from this page (but cannot display)

**Assign Section to Article**
On article form, in meta section

Users
----
When editing a user profile, the form data comes from session variable admin-user. Only users with the role 'super' can edit other users' roles. User name (first, middle, last) are stored in the user doc within name object. No empty strings are stored for name parts. (name.first, name.middle, name.last).


User Roles
----
Roles are set and tested using the package alanning:roles, https://atmospherejs.com/alanning/roles


There are currently 2 groups: __global_roles__, article. __global_roles__ contains the roles 'super-admin' and 'admin'. 'admin' users can only view admin site. 'super-admin' can do everything. In the group 'article', if the user has the role 'edit' then that user can edit or create article docs.

If a user as 'edit' role in the 'article' group, then the edit/upload buttons are shown in the article nav, otherwise hidden. Also, onBeforeAction will check the restricted routes before loading to see if user has permissions.


Article Form
----------------

This form is used in multiple places (Add Article, Edit Article, Verify XML). Data is prepared via `preProcessArticle()`.

**preProcessArticle**
Begins by either taking database article JSON or parsed JSON from XML. If the JSON is from XML, then `compareProcessedXmlWithDb()` checks for data conflicts with the database. Also, if the JSON is from XML, `articleExistenceCheck()` makes sure that there are no duplicate articles.

**Data**

The data for the form comes from the session variable `article-form` and is not reactive.  The database data needs to be preprocessed to include all issues, all paper types etc so that the dropdown menus and buttons options (for ex, article type buttons) in the form are complete. Another session variable `article` is used to show the article nav and header. This variable is set in the router. Don't use the session variable for `article-form` because that contains extra information not needed for the nav/header, and also we can show the header while the form is still processing.

When adding PII, if the article doc had a PII in the DB then that is included in the form (for when if the user had removed PII while working on the form then wanted to add it back). If the article doc didn't have a PII, then the next incremental PII is included on the form.

Author affiliations are stored within the author object in the article doc. Affiliation numbers are 0 based in the database.

**Saving**

Whether using the form to create a new article doc, or updating an existing article doc, the article information is passed to `validateArticle(mongoId, articleData)` in /client/js/admin/article/articleMethods.js. This function will first check for duplicate articles. Duplicate articles are found using `articleExistenceCheck(mongoId, articleData)`, which will query for title and IDs. If an article is found and the `_id` of the doc does not match the provided mongoId then validation is stopped and the user is notified. If no duplicate found, then the inputs are validated. Currently, only title is required and the only requirement is that it is not empty. `validateArticle()` will return an object, which has three flags checked on the event handler: duplicate, invalid, saved. If result.duplicate then the returned object is the duplicate article. If result.invalid, then the returned result contains all the invalid input IDs with messages for each. If result.saved then article was saved (updated or inserted). If saving the data, articleUpdate() is used. This will also insert and return `_id` if inserted.


Article Files Uploader
--------------------------
**XML**

 - Can upload PMC or AOP (PubMed) XML
 - Only PMC XML is uploaded to S3, which is full text XML
 - AOP XML is used only to update the DB.
 - Since the same form is used for AOP and PMC XML, there's a flag in the session variable `article-form.aop` and if set to true, the upload button is hidden but the form is still displayed.
 - xmlMethods.js: This file contains functions to parse XML to JSON, and to get that JSON in the schema for the DB. Also contains functions for comparing XML JSON with DB JSON
 - Issue handling: if volume and issue in XML, but no record in the issues collection, then insert. This happens on processing, so before the article form gets saved. The reason is because issues can be deleted/hidden easily (still a todo).
 - Duplicate article checked on processing. User is notified above article form.

Uploading XML

Using compareProcessedXmlWithDb(). Take the XML data and compare with the data from the DB for the article form and before XML is uploaded. There are things in DB that are not in the XML. For example, if an article is advance or feature. Merged data will be from the XML if there is a conflict. If XML is missing the data, then merged will be from the database. Dates are treated as strings for comparisson.

After uploading XML, the file is checked for supplementary materials and if found the article doc in the DB is updated. afterUploadXmlFilesCheck() is called from the client.

----------


Article Files
-------------
**XML**

 - File naming: articleMongId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the xml folder

XML files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**PDF**

 - File naming: articleMongId.pdf
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the pdf folder

PDF files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**Figures**
 - File naming: articleMongId_figureId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the paper_figures folder

Before rendering the template, AdminArticleFigures, if the article has XML uploaded, then it's parsed for figure nodes. The ID, label, title and caption are listed below the figure uploader/editor. The data for the XML figures is stored in the session variable `xml-figures`.

Deleting: Not enabled.

Uploading: The only way to update the figures in the DB is via uploading XML (besides filename) Only figures listed in the DB can be uploaded. Uses template s3ArticleAssetsUpload. First the file is uploaded to the paper_figures folder on S3, which must happen on the client. Then on the server, using afterUploadArticleAsset(), the uploaded figure is renamed to standard convention (articlemongoid_figureid). The original file is copied and named using articlemongoid_figureid. The original file is deleted, via the client. See articleEvents.js. This DOES NOT update the database. The only way to update the figures in the DB is via uploading XML.

**Supplemental**
 - File naming: articleMongId_suppId
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the supplemental_materials folder

Uses same template and functions as figure uploader.


New Article via XML
----------------
Uses template AdminUploadArticleXml. Duplicates artilces are checked via articleExistenceCheck(), if found then modal links to found article. Works with AOP PubMed XML and PMC Full Text XML. Uses the session variable new-article to display the processed article data for the user to verify. When this variable is null, the uploader is shown. Otherwise, article verification is shown.

Authors
----------------
There is a collection for authors, authors. This is updated after saving the article form. Author affiliations are stored as objects in an array in the author doc `[{affiliation: “Harvard”}]`, so that we can add attributes if current or other data about the known affiliations.

Issue Pages
-------------
This gets updated via article collection hooks. There is no input for issue pages. After inserting/updating an article, if any of these conditions true then the pages are recalculated:
-  start page changed
-  end page changed
-  display changed (articles hidden aren't used to calculate page span)
-  issue changed (both issues' page spans get updated)

Issue Form
-------------
**Validation and Duplicate Check**
Submit form event uses method ‘validateIssue()‘ to check all required inputs and make sure there are no duplicate issues (via Volume and Issue search).

Makes sure display is also checked if current is. Before updating, if another issue was set to current then unset. If issue is set to current, can’t be unchecked. So that there is always a current issue. The only way to change current issue is by setting another issue to current.

Issue Deletion
-------------
Deleting an issue will delete all issue information from the database and remove all issue information for its articles. User input to confirm deletion is sent to deleteIssue(), which makes sure that the input === 'DELETE'. If so then, the issue doc is copied to the issues_deleted collection via deleteIssueDatabase() and the original doc is removed from the issues collection. Then all articles in the issue are updated (just issue information removed from article docs). TODO: Cover deleting on S3.

Issue Cover
-------------
The cover is uploaded using the template ‘IssueCoverUploader‘. The upload event is on the client, using the template events. Covers cannot be added when adding an issue. Covers can only be added to existing issues.


App Packages
============
**alanning:roles**
For adding roles to user docs in the DB

**aldeed:template-extension**
For dynamic templates

**aslagle:reactive-table**
A reactive table designed for Meteor. Used on: AdminDataSubmissions, AdminDoiStatus, and adminArticle

**accounts-password**
For users accounts

**bambattajb:sticky**
Used on the full text section navigation.

**blaze-html-templates**
Compile HTML templates into reactive UI with Meteor Blaze

**email**
Allows sending email from a Meteor app. Published by mdg.

**fourseven:scss**
Sass and SCSS support

**gadicohen:headers**
TODO: remove this package
For institutaion access. In helpers getInstitutionByIP and isSubscribedIP

**gandev:server-eval**
This allows server logs to be viewed in the browser console. Could be removed for productions.

**hitchcott:panzoom**
Used on ArticleFigureViewer to zoom in/out on figures

**http**
Used to make http requests.

**iron:router**
For client and server routes

**jquery**

**lepozepo:s3**
Used for uploading files to AWS S3

**logging**
This is an internal Meteor package. Published by mdg

**matb33:collection-hooks**
For adjusting data on insert/update/delete of database collections

**materialize:materialize**
Used for front-end framework

**meteorhacks:aggregate**
A simple package to add proper aggregation support for Meteor. This is used to find duplicate articles by PII, PMID, and title, in function duplicateArticles() in articleMethods.js.

**meteorhacks:npm**
This allows us to use node.js packages. Using xml2js and xpath for XML parsing.

**mizzao:jquery-ui**
Smart package for jquery ui, which is used for sortable actions on admin site.

**momentjs:moment**
This is a smart package for moment, which is used to parse dates in JavaScript

**mongo**
Adaptor for using MongoDB and Minimongo over DDP

**ostrio:iron-router-title**
Used to change document.title via router.

**reactive-var**
A general-purpose reactive datatype for use with tracker. Published by mdg.

**reload**
The reload package handles the process of migrating an app: serializing the app's state, then shutting down and restarting the app. Published by mdg

**risul:moment-timezone**
Used to set timezone of application, so that article data processing doesn't change with timezone.

**session**
This package provide Session.Session is a special ReactiveDict whose contents are preserved across Hot Code Push.

**spacebars**
Meteor template language. Published by mdg

**standard-minifiers**
This package includes the JS and CSS standard minifiers in your Meteor project. Published by mdg.

**tracker**
Meteor Tracker is an incredibly tiny (~1k) but incredibly powerful library for transparent reactive programming in JavaScript.

**vojtechklos:materialnote**
Used on admin site for wysiwyg input.

**zimme:active-route**
Use to determine if the current route is the active one. For ex, to add active class to button groups.
