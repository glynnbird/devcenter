# DevCenter Admin

This is a Node.js Web App to be used to manage the database of articles that feed the CDS "How-tos"
section, Bluemix contextual search amongst others. It provides the following functionality:

* a NoSQL database of article URLS and their meta data
* a search API to allow third party systems to search the database
* a Content Management System web UI to allow administrators to 
* * add/edit/delete content
* * edit the schema
* an API that allows a third party system to suggest URLs to be added to the database
* an API used to allow Slack 'slash command' to be connect to suggest URLs to be added to the database

## Configuration

This a Bluemix app and expects an attached Cloudant NoSQL database service to be attached called "devcenter-cloudant".

You can run this app locally by setting appropriate environment variables to simulate a Bluemix environment e.g

```sh
export VCAP_SERVICES='{"cloudantNoSQLDB":[{"name":"devcenter-cloudant","label":"cloudantNoSQLDB","plan":"Shared","credentials":{"username":"myusername","password":"mypassword","host":"myhost.cloudant.com","port":443,"url":"https://myusername:mypassword@myhost.cloudant.com"}}]}'
export PASSWORD=1f2dd4437feca264b4ba93c2b4e71667bcd32e2d
export SLACK_TOKEN=xPxB8e1031GOh2oJLoofvoEi
export API_KEYS=7c9fdffca0d003646a9f1fdf591f29a9
export VCAP_APP_HOST=http://localhost:6007/
node app.js
```

## Data 

In it's simplest form, an item in the database looks like this:

```
{  
{
  "_id": "069f0fa6b0247d5bb843f32d6d44c608b925d798",
  "_rev": "1-3ea7e27db22ae8ba7e1989c82359ff7d",
  "name": "Document title",
  "full_name": "A longer document title",
  "description": "this is a longer form description of the document",
  "body": "this is the document body",
  "url": "https://full.url.com/",
  "created_at": "2015-09-11 09:45:34 +00:00",
  "updated_at": "2015-09-11 09:45:34 +00:00",
  "imageurl": "https://developer.ibm.com/bluemix/wp-content/uploads/sites/20/2015/09/loopback-hero.png",
  "status": "Provisional",
}
```

The documents are formatted in JSON with the `_id` and `_rev` are the unique identifier and revision token from the Cloudant database. The other fields are self explanatory; some of them are automatically populated when a document is created.

The `_id` is autoamatically calculated when a document is created and is a hash of the URL. This ensures that two documents with the same URL cannot be stored in the database. Because of this, a documents URL should not be changed after its creation.

It is important to ensure that the `created_at` and `updated_at` fields are in "YYYY-MM-DD" format, so that sort ordering will be in the correct order. 

The `status` field can take one of three values:

* Provisional - the status of a document prior to publication
* Live - a published document
* Deleted - a document that is no longer required.

Only 'Live' documents are indexed for searching.

## Schema

As well as the core fields of a document, any number of custom fields can be added. The configuration of the custom fields is stored in a special document whose `_id` is 'schema'. 

Each key of the `schema` object (apart from `_id` and `_rev`) represents a field that can be used in our documents. The following fields are used to configure the schema:

| field        | Description                      | e.g.                                            |
| ------------ | ---------------------------------| ----------------------------------------------- |
| type         | the data type                    | "string", "boolean", "number", "arrayofstrings" |
| enforceValues| whether values are enforced      | true, false                                     |
| values       | array of possible values         | ["red", "green", "blue"]                        |
| faceted      | whether to facet or not          | true, false                                     |


Simple string/boolean/number values, can be simply expressed with:

```
  "otherurl": {
    "type": "string"
  },
```

If a field's value is to picked from set of fixed values, then the list of values can be recorded in the schema. The 'level' field has such a definition:

```
"level": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Beginner",
      "Intermediate",
      "Advanced"
    ],
    "faceted": true
  }
```

It is a a "string" whose values are enforced and so can only take one of "Beginner", "Intermediate" or "Advanced". 

The 'arrayofstrings' type is useful for creating fields that can take multiple values. The 'namespace' field has the following configuration:

```
  "namespace": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Bluemix",
      "Cloud Data Services",
      "Mobile First"
    ],
    "faceted": true
  }
```

This states that 'namespace' is an array of strings whose values can only be one or more of "Bluemix", "Cloud Data Services" and "Mobile First".


A typical full schema document looks like this:

```
{
  "_id": "schema",
  "_rev": "2-f9b34956c87b341054ca7e0f47d2ff4c",
  "languages": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Ruby",
      "Python",
      "Java",
      "JavaScript",
      "PHP",
      "Objective-C",
      "C#",
      "Swift",
      "C"
    ],
    "faceted": true
  },
  "technologies": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Bluemix",
      "Cloud Foundry",
      "Virtual machines",
      "Containers",
      "Cloudant",
      "Cloudant Local",
      "Cordova",
      "CouchDB",
      "DataWorks",
      "Elasticsearch",
      "Graph Data Store",
      "Ionic",
      "Looker",
      "MobileFirst",
      "MongoDB",
      "OAuth",
      "PhoneGap",
      "PostgreSQL",
      "PouchDB",
      "Redis",
      "Salesforce",
      "Spark",
      "WebSockets",
      "dashDB"
    ],
    "faceted": true
  },
  "topic": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Article",
      "Tutorial",
      "Video",
      "Sample",
      "API",
      "Blog",
      "Forum"
    ],
    "faceted": true
  },
  "featured": {
    "type": "boolean",
    "faceted": true
  },
  "demourl": {
    "type": "string"
  },
  "githuburl": {
    "type": "string"
  },
  "videourl": {
    "type": "string"
  },
  "documentationurl": {
    "type": "string"
  },
  "author": {
    "type": "string"
  },
  "otherurl": {
    "type": "string"
  },
  "level": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Beginner",
      "Intermediate",
      "Advanced"
    ],
    "faceted": true
  },
  "type": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Article",
      "Tutorial",
      "Video"
    ]
  },
  "namespace": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Bluemix",
      "Cloud Data Services",
      "Mobile First"
    ],
    "faceted": true
  }
}

```

## Faceting

All fields in the schema are indexed for search, but only fields marked `faceted: true` are faceted. A faceted field is one whose values are counted in a result set to give the user insight into the make up of the result set. In the search results, facet counts appear like this: 

```
"counts": {
        "namespace": {
            "Bluemix": 5,
            "Cloud Data Services": 2,
            "Mobile First": 2
        },
        "level": {
            "Advanced": 1,
            "Intermediate": 1,
            "Beginner": 8
        }
}
```

Faceting is useful for fields that have repeating values within the data set (e.g. brand, colour, category, country etc). Faceting is entirely unsuitable for for fields which are unique within the data set (e.g. ids, description, url).

A good rule of thumb is that faceting should be enabled for fields whose values are enforced and come for a fixed set of possibilities.

## API

Third-party systems can add articles to the database by POSTING to the `/api/submit` endpoint passing

* url - the URL of the article to submit
* token - the api key used to identify valid API calls
* namespace - the namespace used to tag the document

where the token must be one of the keys listed in the `API_KEYS` environment variable.

e.g.

```
curl -X POST -d 'url=http%3A%2F%2Fmyblog.com%2Fpost%2F1&token=abc123&namespace=Cloud+Data+Services' 'https://mydevcenter.mybluemix.net/api/submit'
```

A successful API call will return a JSON message such as:

```
{
    "ok": true,
    "msg": "Thanks for submitting http://myblog.com/post/1. The URL will be published after it is reviewed by a human.",
    "id": "d0cfae70c5b7f00b0e858ee6c7b99be73d6bd60d"
}
```

If a URL is already in the database, the response will look like:

```
{
    "ok": false,
    "msg": "There was an error :( Error: Document update conflict."
}
```

It is pretty easy to hook up to the API using a tool like Node-RED. First we create a "sub flow" that expects an input from a Feed Parse node. 

![subflow](https://github.com/ibm-cds-labs/devcenter/raw/master/public/img/subflow.png)

It will:

* converts the Feed Parse output into the form required to HTTP POST 
* HTTP POST the data to the /api/submit endpoint

The function's source code is as follows:

```js
var link = msg.article.link;
var namespace = msg.namespace || "";
var msg = {};
msg.headers={"Content-type": "application/x-www-form-urlencoded"};
msg.payload= "token=03646a9f1fdf7c9fdffca0d0591f29a9";
msg.payload+= "&url=" + encodeURIComponent(link);
msg.payload+= "&namespace=" + encodeURIComponent(namespace);
return msg;
```

We can the hook up several feeds to this sub-flow:

![rss reader](https://github.com/ibm-cds-labs/devcenter/raw/master/public/img/rss.png)

We hook up each feed to the sub flow, passin the data through functions which add a custom namespace parameter:

```js
msg.namespace = "Cloud Data Services";
return msg;
```

## Slack API

The Slack API (POST /slack) is almost identical to the `/api/submit` call but the URL is passed in the `text` parameter and the `token` field is validated against the `SLACK_TOKEN` environment variable.

e.g.

```
curl -X POST -d 'text=http%3A%2F%2Fmyblog.com%2Fpost%2F1&token=abc123' 'https://mydevcenter.mybluemix.net/slack'
```

This allows a Slack "slash command" to be setup to point to this app's '/slack' endpoint to allow your slack users to suggest content by typing

```
/customslackcommand http://myblog.com/post/1
```

in their Slack app or web interface, where `customslackcommand` is string defined in your Slack account.

## Web UI

This app presents a web app that provides the following features: 

* new articles to be added by completing a form
* provisional articles to be suggested by supplying just the URL of the article
* editing of any article
* editing of the schema

N.B. Only articles who have a `status` field with value 'Live' are indexed for search. The only way to edit an article's status is using the Web UI. This is deliberate to ensure that there is human oversight before content is published.


## Search API

Under the hood, the articles data is stored in an IBM Cloudant database. Cloudant is a NoSQL database offerring an HTTP API and can be queried using MapReduce and using Lucene indexes. When the app is installed, a database called 'devcenter' is created and indexes are created to allow

* articles to be queried by `status` for the web UI menu page, using a MapReduce view
* articles to be queried using the Lucene query language using Cloudant Search

Both indexes are created automatically; the Lucene index is updated every time the schema is changed, to ensure that all fields are correctly indexed.

To query the search index, locate the domain name of the Cloudant service that is associated with your Bluemix app. This can be found in the Bluemix dashboard and will look something like this: 

```
https://9582d32-634c-4ade-83fe-966ea8a8d8c7-bluemix.cloudant.com
```

The URL of the search API is calculated by adding `/devcenter/_design/search/_search/search` to the end of the Cloudant URL. 

The following fields are then used for querying:

| field        | Description                         | e.g.                                            |
| ------------ | ------------------------------------| ----------------------------------------------- |
| q            | the search query                    | `*:*`                                           |
| include_docs | whether to return the document body | `true`                                          |
| counts       | list of faceted fields to count     | `["level", "namespace"]`                        |
| limit        | the number of results to return     | `10`                                            |
| sort         | override the sort order             | `"-date"`                                       |

Some hints:

* `*:*` means 'match everything'
* fielded queries follow this pattern `level:beginner`
* logic can be performed too `level:beginner AND namespace:Bluemix`
* free-text search `q=pouchdb replication javascript`
* combine free-text and fielded search `q=pouchdb+replication+javascript+AND+namespace:Bluemix`
* you may only do `counts` on fields that were marked as 'facet:true' in the schema
* you probably want `include_docs=true`

Full Cloudant Search documentation is [https://docs.cloudant.com/search.html][here].

### Sorting

By default, the sort order is 'best match' first. This can be overriden but Cloudant search limits sorting to numeric fields, or string fields that are not 'analyzed'. To this end a `date` field is automatically indexed for your convenience that can be used to sort the result set in date order (`sort="date"`) or reverse date order (`sort="-date"`).

Sorting of boolean fields can be acheived by doing `sort="featured<string>"` (false first) or `sort="featured<string>"` (true first).

## Environment variables

This app can be configured within Bluemix using the following set of environment variables, as well as `VCAP_SERVICES` which specifies the attached Bluemix services.

| field        | Description                              | e.g.                                            |
| ------------ | -----------------------------------------| ----------------------------------------------- |
| PASSWORD     | the password used to login to the web UI | mypassword                                      |
| SLACK_TOKEN  | list of valid Slack tokens               | abc123,def456                                   |
| API_KEYS     | list of valid API keys                   | abc123,def456                                   |



