pagax_modules.ajax = pagax_modules.ajax || {

    default_request: {
        url:window.location.href,
        data: {
            location : window.location.href
        },
        before_message:"", 
        error_message:"",
        error:function(){},
        success_message:"",
        success:function(){},
        failed:function(){}
    },

    last_request:this.default_request,
    request_count : 0,
    active_request : "",
    running_requests : [],
    running_request_parameters : {},
    build : function(parameters){
        var request = {
            url:parameters.url,
            type:parameters.hasOwnProperty("type")?parameters.type:"POST",
            data:parameters.hasOwnProperty("data") ? parameters.data : {},
            before_message:parameters.hasOwnProperty("before_message")?parameters.before_message:"",
            success_message:parameters.hasOwnProperty("success_message")?parameters.success_message:"",
            error_message:parameters.hasOwnProperty("error_message")?parameters.error_message:"",
            contentType:parameters.hasOwnProperty("contentType")?parameters.contentType:"application/x-www-form-urlencoded; charset=UTF-8",
            beforeSend:function(response,status,xhr){
                if(parameters.hasOwnProperty("beforeSend") && typeof parameters.beforeSend == 'function') {
                    parameters.beforeSend(response,status,xhr);
                }
            },
            error:function(xhr,status,error){
                if(parameters.hasOwnProperty("error") && typeof parameters.error == 'function') {
                    parameters.error(xhr,status,error);
                }
            },
            success:function(response,status,xhr){
                if(parameters.hasOwnProperty("success") && typeof parameters.success == 'function') {
                    parameters.success(response,status,xhr);
                }
            },
            complete:function(response,status,xhr){
                if(parameters.hasOwnProperty("complete") && typeof parameters.complete == 'function') {
                    parameters.complete(response,status,xhr);
                }
            },
            failed:function(response,status,xhr){
                if(parameters.hasOwnProperty("failed") && typeof parameters.failed == 'function') {
                    parameters.failed(response,status,xhr);
                }
            }
        };

        if(!request.hasOwnProperty("callback_parameters")) {
            request.callback_parameters = {};
        }

        request.data["view_only"] = request.data.hasOwnProperty("view_only") ? request.data.view_only : "true";
        request.data["requesting_url"] = request.data.hasOwnProperty("requesting_url") ? request.data.requesting_url : window.location.href;
        return request;
    },
    new_request : function(feed) {
        var obj = this;

        feed = obj.build(feed);
        var request = $.ajax({
            url:feed.url,
            data:feed.data,
            type:feed.type,
            timeout:60000,
            contentType : feed.contentType,
            beforeSend:function(xhr) {
                obj.running_requests.push(feed.url);
                obj.running_request_parameters[feed.url] = feed;
                if (obj.active_request == "") {
                    obj.active_request = feed.url;
                }

                if(feed.before_message) {
                    $(".pagax-loader-layer .message-box")
                        .removeClass("success error");
                    $(".pagax-loader-layer .message").html(obj.running_request_parameters.hasOwnProperty(obj.active_request) ? obj.running_request_parameters[obj.active_request].before_message : feed.before_message);
                    $(".pagax-loader-layer").show();
                }

                obj.last_request = feed;

                feed.beforeSend(xhr);
            },

            success:function(response,status,xhr) {

                try {
                    response = $.parseJSON(response);
                } catch(err) {
                    feed.callback_parameters.is_json = false;
                }

                if (response.hasOwnProperty("data")) {
                    feed.callback_parameters.data = response.data;
                } else {
                    feed.callback_parameters["data"] = {
                        title : "",
                    };
                }
                
                if(response != null) {

                    if (response.status == "success") {
                        if (response.hasOwnProperty("data") && (response.data.hasOwnProperty("redirect") || response.data.hasOwnProperty("refresh"))) {
                            pagax_modules.pagax.process_content(feed, response, feed.success);
                        } else {
                            feed.success(feed.callback_parameters);
                        }

                        obj.refresh_content(response);
                        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("onload")) {
                            eval(response.data.onload);
                        }
                    }
                }


                if(response != null && (!response.hasOwnProperty("status") || (response.hasOwnProperty("status") && response.status == "success"))) {
                    if ((feed.hasOwnProperty("redirect") && !feed.redirect) || !feed.hasOwnProperty("redirect")) {
                        if (obj.running_requests.length <= 1) {
                            $(".pagax-loader-layer").hide();
                        }
                    }
                    if (response.hasOwnProperty("message") || feed.success_message) {
                        $(".pagax-loader-layer .message-box")
                            .removeClass("error")
                            .addClass("success")
                        $(".pagax-loader-layer .message").html(response.hasOwnProperty("message") ? response.message : feed.success_message)
                        $(".pagax-loader-layer").show();

                        if (obj.running_requests.length == 1) {
                            setTimeout(function(){
                                $(".pagax-loader-layer").fadeOut(function(){
                                    $(".pagax-loader-layer").hide();
                                });
                            }, 2000);
                        } else {
                            $(".pagax-loader-layer .message-box").removeClass("success error");
                            $(".pagax-loader-layer .message").html(obj.running_request_parameters[obj.active_request].before_message);
                            $(".pagax-loader-layer").show();
                        }
                    } else if (obj.running_requests.length <= 1) {
                        $(".pagax-loader-layer").hide();
                    }
                }
                else if(response != null && (response.hasOwnProperty("status") && response.status == "failed")) {
                    if (response.hasOwnProperty("message") || error_message) {
                        $(".pagax-loader-layer .message").html((response.hasOwnProperty("message") ? response.message : error_message));
                    } else {
                        $(".pagax-loader-layer .message").html("Some error occurred");
                    }

                    feed.failed(response,status,xhr);

                } else if (response == null) {
                    $(".pagax-loader-layer .message-box")
                        .removeClass("success")
                        .addClass("error")
                    $(".pagax-loader-layer .message").html(error_message)
                    $(".pagax-loader-layer").show();
                }
                else
                {
                    if (obj.running_requests.length == 0) {
                        $(".pagax-loader-layer").hide();
                    }
                }

                obj.last_request = obj.default_request;
            },

            complete:function(response,status,xhr) {
                var count = 0;
                var running_requests = [];
                $.each(obj.running_requests, function(key, value) {
                    if (value != feed.url) {
                        running_requests[count] = value;
                        count++;
                    }
                });

                obj.running_requests = running_requests;
                delete obj.running_request_parameters[feed.url];

                if (obj.running_requests.length) {
                    obj.active_request = running_requests[0];
                    $(".pagax-loader-layer .message-box").removeClass("success error");
                    $(".pagax-loader-layer .message").html(obj.running_request_parameters[obj.active_request].before_message);
                } else {
                    obj.active_request = "";
                }

                obj.form_is_in_progress = false;
                $("#pagax_request_try_again").click(function(){ obj.new_request(obj.last_request) });

                feed.complete(response,status,xhr);
            },

            error:function(xhr,status,error) {

                if(status == "error") {
                    if (error == "Internal Server Error") {
                        $(".pagax-loader-layer .message").html("Internal Server Error!&nbsp;<a class=\"link\" href=\"javascript:void(0);\" id=\"pagax_request_try_again\" style=\"float:none; margin-top:0;\">Try Again</a>");
                    } else {
                        $(".pagax-loader-layer .message").html("Error!&nbsp;No internet connection.&nbsp;<a class=\"link\" href=\"javascript:void(0);\" id=\"pagax_request_try_again\" style=\"float:none; margin-top:0;\">Try Again</a>");
                    }
                }

                if(status == "timeout") {

                    $(".pagax-loader-layer .message").html("Error!&nbsp;Connection Timed out.<a class=\"link\" id=\"pagax_request_try_again\" style=\"float:none; margin-top:0;\">Try Again</a>");

                    if(obj.request_count < 3) {

                        var countTime = 5;
                        $(".pagax-loader-layer .message").html("Error!&nbsp;Connection Timed out.&nbsp;Trying Again in "+countTime+" sec.");
                        var setTime = setInterval(function(){
                            countTime--;
                            $(".pagax-loader-layer .message").html("Error!&nbsp;Connection Timed out.&nbsp;Trying Again in "+countTime+" sec.");

                            if(!countTime) {
                                clearInterval(setTime);
                            }

                        }, 1000);

                        setTimeout(function() {
                            obj.request_count++; obj.new_request(feed, ''); 
                        }, 5500);
                    }
                }

                feed.error(xhr,status,error);
            }
        });
    },

    submit_form : function(parameters, callback_function) {

        var obj = this;
        if((window.ActiveXObject || "ActiveXObject" in window)) {
            return true;
        }

        parameters["success"] = function(response){

            if(response != "") {
                var has_form_parameters = true;

                if(response.hasOwnProperty("data") && response.data.hasOwnProperty("redirect")) {
                    pagax_modules.pagax.handle_redirect(response);
                    return false;
                }

                obj.call_callback(callback_function, response, parameters, has_form_parameters);
            }

        };

        parameters["failed"] = function(response){

            return false;

        }

        obj.new_request(parameters);
        return false;
    },

    refresh_content : function (response) {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("refresh")) {
            $.each(response.data.refresh, function(refresh_key, item){
                var data = {};

                $.ajax_request({
                    url : HOST+refresh_key,
                    before_message : "Loading",
                    data : data,
                    success : function(resp) {
                        $("#"+item).html(resp.data.content);
                        $("#"+item).loaded();
                    }
                });
            });
        }
    },
    parseQueryString : function(queryString) {

        if(queryString) {

            var params = {}, queries, temp, i, l;
            queryString = queryString.split("?");
            queries = queryString[1].split("&");

            for ( i = 0, l = queries.length; i < l; i++ )  {
                temp = queries[i].split('=');
                params[temp[0]] = temp[1];
            }
            return params;
        }
    },

    set_callback_parameters : function (response, parameters, has_form_parameters) {
        callback_parameters = parameters.hasOwnProperty('callback_parameters')?parameters.callback_parameters:{};
        callback_parameters.title = response.data.hasOwnProperty("title")?response.data.title:history.state.title;
        callback_parameters.data = response.data;

        if(has_form_parameters) {
            callback_parameters.form_parameters = true;
        }
        return callback_parameters;
    },

    call_callback : function (callback_function, response, parameters, has_form_parameters) {
        var obj = this;
        if(callback_function != "") {

            if(typeof callback_function == 'function') {
                func = callback_function;
            } else {
                var func = window[callback_function];
            }

            if(func !== 'undefined' && $.isFunction(func)) {
                var callback_parameters = obj.set_callback_parameters(response, parameters, has_form_parameters);
                func(callback_parameters);
            }
        }
    }
};

$.ajax_request = function(request_parameters, request_callback) {
    pagax_modules.ajax.new_request(request_parameters, request_callback);
};