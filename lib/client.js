var util  = 
    require('util'), 
    telapi_schema = require("./schemas/telapi.json"), 
    S = require('string'),
    querystring = require('querystring'),
    https = require('https');


var TelAPI = module.exports.TelAPI = function(account_sid, auth_token) {

    /** TelAPI AccountSid **/
    this.account_sid = account_sid;

    /** TelAPI AuthToken **/
    this.auth_token  = auth_token;

    this.host        = 'api.telapi.com';

    this.port        = 443;

    /** Base and required helper URI from which all URIs are built **/
    this.base_uri    = '/%s/Accounts/%s';

    /** TelAPI version **/
    this.api_version = '2011-07-01';

    /** TelAPI content type **/
    this.content_type = 'json';

    /** Current request url. THIS WILL BE REWRITTEN BY CLASS ITSELF! **/
    this.request_url  = '';

    /** ... **/
    this.request_method       = 'GET';

    this.request_querystring  = {};

    this.request_postdata     = {};


    /** MASTER CRUD API METHODS. EVERTHING YOU NEED TO HAVE **/

    this.get         = function(resource, parameters, success, error) {
        util.log("[INFO] RESOURCE DETAILS: " + resource);
        util.log("[INFO] BUILT URL IS: " + this._buildUrl(resource, parameters));
        this._run(success, error);
    };

    this.create      = function(resource, post_data, success, error) {

    };

    this.update      = function(resource, post_data, success, error) {

    };

    this.delete      = function(resource, success, error) {

    };

    this.getResource = function(resource) {
        for(var component in telapi_schema.rest_api.components) {
            if(component == resource.toLowerCase()) {
                return telapi_schema.rest_api.components[component];
            }
        }
        return null;
    };

    this.resourceExists = function(resource) {
        for(var component in telapi_schema.rest_api.components) {
            if(component == resource.toLowerCase()) return true;
        }
        return false;
    };

    this.getAvailableResources = function() {
        var available_resources = [];
        for(var component in telapi_schema.rest_api.components) {
            available_resources.push(component);
        }
        return available_resources;
    };

    /** "PRIVATE" MEMBERS USED FOR INTERNAL PURPOSES ONLY **/

    /**
     *
     */
    this._buildUrl   = function(uri_parts, parameters) {
        
        // Restart request url to zero
        this.request_url = '';

        // Now let's build base url which will include account
        this.request_url = util.format(this.base_uri, this.api_version, this.account_sid);

        var resource_details = {};
        var resource         = '';
        var resource_extras  = '';

        // In case that user wants to fetch account or accounts resorce we are breaking url built
        // because we already have it built
        if( typeof uri_parts == 'string' ) {
            resource = uri_parts;
        }
        else if (typeof uri_parts == 'object') {
            resource = uri_parts[0];
            delete uri_parts[0];
            for(var index in uri_parts) resource_extras += "/" + uri_parts[index];
        }

        if (resource != 'account' && resource != 'accounts') {

            if(!this.resourceExists(resource)) {
                throw new Error(
                    "Resource [" + resource + "] do not exist and therefore is not valid "+ 
                    "resource. Available resources are: [" + this.getAvailableResources() + "]"
                );
            }

            resource_details = this.getResource(resource);
            this.request_url += "/" + resource_details.url + resource_extras;
        }

        this.request_url += '.' + this.content_type;
        this._assertGetParams(parameters);

        return this.request_url;
    }

    this._assertGetParams = function(parameters) {
        this.request_querystring = querystring.stringify(parameters);
        if( this.request_querystring.length > 1)
            this.request_url += "?" + this.request_querystring;
    };

    /**
     *
     */
    this._run        = function(succ, err) {
        
        var request_options = {
            host   : this.host,
            port   : this.port,
            path   : this.request_url,
            method : this.request_method,
        };

        request_options.headers = {}
        request_options.headers.Host = this.host;
        request_options.headers.Authorization = "Basic " + (new Buffer(this.account_sid + ':' + this.auth_token)).toString('base64');

        var request = https.get(request_options, function(response) {
            var responseChunks = [];
            response.setEncoding('utf8');

            response.on('data', function(chunk) { responseChunks.push(chunk); });

            response.on('end', function() {
                try { body = JSON.parse(responseChunks.join('')); } 
                catch(err) { }
                if(typeof succ == 'function') succ(body);
            });

            if(typeof err == 'function') response.on('error', err);
            
        });

    }

    // Let's make sure that credentials are all set...
    if(this.account_sid.length != 34 || !S(this.account_sid).startsWith('AC')) throw new Error("AccountSid is not valid!");
    if(this.auth_token.length != 32) throw new Error("AuthToken is not valid!");

};