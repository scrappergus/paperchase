**Paperchase Documentation**
========================
An academic journal platform.

App Structure
============
 - **/:** for client and server side. Some of these files will have checks for where on app part of file can be used, for ex: if `(Meteor.isClient) {}`
 - **/client:** for client side
 - **/js:** for client and server side
 - **/server:** for server side
 - **/templates:** templates
 - **/public:** static assets. (journal images, not article images)


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

News
----
Stored in the news collection. Doc contains - title, content, date, display, and also updates by users are tracked (just user id and date).
Session variable `newsId` used in news form helper.

**Database Publications**
newsListDisplay: Only news items to display to public
newsItem: Publication by Mongo ID

Section Pages
-------------
**Section Papers Page**
List of articles comes from session variable article-list.
Session variable article-list is set in the router, onBeforeAction. Preprocessing of the list occurs in the server method preprocessSectionArticles to retrieve URLs of assets (PDFs, Figures, etc) for showing buttons.


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

Authors
----------------
There is a collection for authors, authors. This is updated after saving the article form. Author affiliations are stored as objects in an array in the author doc `[{affiliation: “Harvard”}]`, so that we can add attributes if current or other data about the known affiliations. 


App Packages
============
To Do. List packages and their use


