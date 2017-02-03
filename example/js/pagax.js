var pagax_modules={};
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
            timeout:parameters.hasOwnProperty("timeout")?parameters.timeout:60000,
            type:parameters.hasOwnProperty("type")?parameters.type:"POST",
            data:parameters.hasOwnProperty("data") ? parameters.data : {},
            before_message:parameters.hasOwnProperty("before_message")?parameters.before_message:"",
            success_message:parameters.hasOwnProperty("success_message")?parameters.success_message:"",
            error_message:parameters.hasOwnProperty("error_message")?parameters.error_message:"",
            contentType:parameters.hasOwnProperty("contentType")?parameters.contentType:"application/x-www-form-urlencoded; charset=UTF-8",
            processData:parameters.hasOwnProperty("processData")?parameters.processData:true,
            async:parameters.hasOwnProperty("async")?parameters.async:true,
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
            timeout:feed.timeout,
            contentType : feed.contentType,
            processData:feed.processData,
            beforeSend:function(xhr) {
                $(".cancel-loader").removeClass("open-loader");
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

                feed.callback_parameters.response = response;

                if (!response.hasOwnProperty("data")) {
                    feed.callback_parameters["data"] = {
                        title : "",
                    };
                }

                if(response != null) {

                    if (response.status == "success") {
                        if (response.hasOwnProperty("data") && (response.data.hasOwnProperty("redirect") || response.data.hasOwnProperty("refresh"))) {
                            pagax_modules.pagax.process_content(feed, response, feed.success);
                        } else {
                            feed.success(feed.callback_parameters.response, status, xhr);
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

                    $(".cancel-loader").addClass("open-loader");
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

    submit_form : function(parameters) {

        var obj = this;
        if((window.ActiveXObject || "ActiveXObject" in window)) {
            return true;
        }

        var success_function = parameters.hasOwnProperty("success") ? parameters.success : "";
        var failed_function = parameters.hasOwnProperty("failed") ? parameters.failed : "";

        var handlers = {
            success : function(response){

                if(response != "") {
                    var has_form_parameters = true;

                    if(response.hasOwnProperty("data") && response.data.hasOwnProperty("redirect")) {
                        pagax_modules.pagax.handle_redirect(response);
                        return false;
                    }

                    if(response.hasOwnProperty("data") && response.data.hasOwnProperty("push_url")) {
                        pagax_modules.pagax.push_state(response);
                    }

                    else if(typeof success_function == "function") {
                        success_function(response);
                    }

                }
            },
            failed : function(response){
                if(typeof failed_function == "function") {
                    failed_function(response);
                }
                return false;
            }
        };

        parameters = $.extend({}, parameters, handlers);
        obj.new_request(parameters);
        return false;
    },

    refresh_content : function (response) {
        obj = this;

        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("show")) {
            $.each(response.data.show, function(refresh_route, section){
                if($("#" + section).html().trim() != "") {
                    $("#" + section).find(">").show();
                } else {
                    obj.refresh_section(response, refresh_route, section);
                }
            });
        }

        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("refresh")) {
            $.each(response.data.refresh, function(refresh_route, section){
                obj.refresh_section(response, refresh_route, section);
            });
        }
    },

    refresh_section : function(response, refresh_route, section) {
        obj = this;
        var data = {};

        if(response.data.hasOwnProperty("redirect")) {
            var url = response.data.redirect.split('?');
            if(url.hasOwnProperty(1)) {
                var queryString = url[1];
                var get_parameters = pagax_modules.ajax.parseQueryString("?"+queryString);
            }
        } else {
            var get_parameters = pagax_modules.ajax.parseQueryString(location.search);
        }


        if (get_parameters != "undefined") {
            data = $.extend(get_parameters, data);
        }

        $.ajax_request({
            url : HOST+refresh_route,
            before_message : "Loading",
            data : data,
            success : function(resp) {
                $("#"+section).html(resp.data.content);
                $("#"+section).loaded(resp);
            }
        });
    },
    parseQueryString : function(queryString) {

        var params = {};
        if(queryString) {

            var queries, temp, i, l;
            queryString = queryString.split("?");
            queries = queryString[1].split("&");

            for ( i = 0, l = queries.length; i < l; i++ )  {
                temp = queries[i].split('=');
                params[temp[0]] = temp[1];
            }
        }
        return params;
    },

    set_callback_parameters : function (response, parameters, has_form_parameters) {
        callback_parameters = parameters.hasOwnProperty('callback_parameters')?parameters.callback_parameters:{};
        callback_parameters.title = (response.hasOwnProperty("data") && response.data.hasOwnProperty("title")) ? response.data.title:history.state.title;

        if(response.hasOwnProperty("data")) {
            callback_parameters.data = response.data;
        }

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



pagax_modules.forms = pagax_modules.forms || {

    get_values : function(id) {

        var elem = ["input:text:not([disabled])", "input[type='number']:not([disabled])", "input:hidden:not([disabled])", "input:password:not([disabled])", "input:checkbox:checked:not([disabled])", "input:radio:checked:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"];
        container = $('#' + id);
        var arr = {};

        for(var j = 0; j < elem.length; j++) {

            var inputs = container.find(elem[j]);

            $(inputs).each(function(){

                var element_name = $(this).attr("name")?$(this).attr("name"):$(this).attr("id");

                if (element_name) {
                    element_name = element_name;
                } else {
                    jQuery.error = "Undefined attr name for "+elem[j];
                }

                if(element_name != undefined) {

                    if (element_name.match(/\[\]/g)) {

                        if(($(this).attr("type") == "checkbox" && $(this).is(":checked")) || ($(this).attr("type") != "checkbox")) {
                            element_name = element_name.replace("[]", "");
                            if(!$.isArray(arr[element_name])) {
                                arr[element_name] = [];
                            }
                            arr[element_name].push($(this).val());
                        }

                    } else {
                        arr[element_name] = $(this).val();
                    }

                }
            });
        }
        return arr;
    },

    empty_fields : function(id) {

        var elem = ["input:text", "input:hidden", "input:password", "input:checked", "select", "textarea"];
        container = $('#' + id);

        for(var j = 0; j < elem.length; j++) {

            var inputs = container.find(elem[j]);

            for (var i = 0; i < inputs.length; ++i) {
                inputs[i].value = "";
            }
        }
    }
};

$.fn.onSubmit = function(options){

    if(!options.hasOwnProperty("timeout")) {
        if($(this).data("type") == "script" && pagax_modules.settings.hasOwnProperty("script") && pagax_modules.settings.script.hasOwnProperty("timeout")) {
            options.timeout = pagax_modules.settings.script.timeout;
        } else if (pagax_modules.settings.hasOwnProperty("ajax") && pagax_modules.settings.script.hasOwnProperty("timeout")) {
            options.timeout = pagax_modules.settings.script.timeout;
        }
    }

    options.url = options.hasOwnProperty("url") ? options.url : $(this).attr("action");
    options.type = options.hasOwnProperty("type") ? options.type : $(this).attr("method");
    options.before_message = options.hasOwnProperty("before_message") ? options.before_message : "Loading..";
    var submit_parameters = pagax_modules.ajax.build(options);
    submit_parameters.id = $(this).attr("id");

    pagax_modules.ajax.form_is_in_progress = false;

    $(this).off("submit").on("submit", function(e){
        e.preventDefault();
        var form = $(this);

        setTimeout(function(){
            if (options.hasOwnProperty("validate") && options.validate) {
                if(options.hasOwnProperty("validation")) {
                    if(!options.validation()) {
                        return false;
                    }
                } else if(!form.hasClass("isValid")) {
                    return false;
                }
            }

            if(!pagax_modules.ajax.form_is_in_progress) {
                pagax_modules.ajax.form_is_in_progress = true;

                submit_parameters.data = $.extend({}, submit_parameters.data, pagax_modules.forms.get_values(submit_parameters.id));

                submit_parameters.data = submit_parameters.hasOwnProperty("data") ? submit_parameters.data : {};
                var get_parameters = pagax_modules.ajax.parseQueryString(location.search);

                if (get_parameters != "undefined") {
                    submit_parameters.data = $.extend(get_parameters, submit_parameters.data);
                }

                submit_parameters.anchor = {
                    data : {
                        target : form.data("target") != undefined ? form.data("target") : "content_container"
                    },
                    target : form.data("target") != undefined ? form.data("target") : "content_container"
                };

                submit_parameters.data["data"] = submit_parameters.anchor.data;

                pagax_modules.ajax.submit_form(submit_parameters);
            }
        }, 1);
    });
};


pagax_modules.pagax = pagax_modules.pagax || {

    key_pressed : false,
    user_agent : navigator.userAgent,
    load_content : function(parameters, callback_function) {

        var obj = this;
        var params = {request:"page", page_location:parameters.link, requesting_url:window.location.href};

        if (parameters.hasOwnProperty("url")) {
            params["view_only"] = "true";
        }

        var ajax_parameters = {
            url: parameters.hasOwnProperty("url")?parameters.url:'/ajax.php',
            data:params,
            before_message:parameters.hasOwnProperty("before_message") ? parameters.before_message : "Loading..",
            beforeSend:function(xhr){
                if (parameters.hasOwnProperty("beforeSend") && typeof parameters.beforeSend == 'function') {
                    parameters.beforeSend(xhr);
                }
            },
            error:"",
            success:function(response,status,xhr){
                obj.process_content(parameters, response, callback_function);
            }
        };

        if(parameters.hasOwnProperty("timeout")) {
            ajax_parameters.timeout = parameters.timeout;
        }

        if(parameters.hasOwnProperty("post_parameters")) {
            ajax_parameters.data = $.extend({}, ajax_parameters.data, parameters.post_parameters);

            if (parameters.post_parameters.hasOwnProperty("data") && parameters.post_parameters.data.hasOwnProperty("targetType") && parameters.post_parameters.data["targetType"] == "modal") {
                ajax_parameters.targetType = "modal";
                if (!$("#"+parameters.post_parameters.data.target).length) {
                    pagax_modules.settings.modal.create(parameters.post_parameters.data.target);
                }
                pagax_modules.settings.modal.activate(parameters.post_parameters.data.target);
            }
        }

        if(parameters.hasOwnProperty("redirect")) {
            ajax_parameters = $.extend({}, ajax_parameters, {redirect : parameters.redirect});
        }

        $.ajax_request(ajax_parameters);
    },

    process_content : function (parameters, response, callback_function){
        var obj = this;

        if(response.data == "") {
            window.location = parameters.link;
        } else {

            if(response.hasOwnProperty("data") && response.data.hasOwnProperty("redirect")) {
                obj.handle_redirect(response);
                return false;
            }

            if (response.hasOwnProperty("data")) {
                parameters.response = response.data;
                obj.set_page_content(parameters);
            }
        }

        pagax_modules.ajax.call_callback(callback_function, response, parameters);

    },

    refresh_page : function(event_state) {

        var obj = this;

        state_parameters = {
            url:event_state.url,
            link:event_state.url,
            anchor:event_state.anchor,
            before_message : "Refreshing.."
        };

        if (event_state.anchor.hasOwnProperty("data")) {
            state_parameters.post_parameters = {
                data : event_state.anchor.data
            };
        }

        obj.load_content(state_parameters, function(parameters){
            window.history.replaceState(event_state,parameters.title, event_state.url);
            document.title = parameters.title;
        });
    },

    handle_redirect : function (response) {
        obj = this;

        if(response.data.hasOwnProperty("redirect")) {

            var page = {};
            previous = history.state;
            page.id = previous.id+1;
            page.url = response.data.redirect;
            page.title = response.data.title;
            page.anchor = {target:"content_container"};

            obj.load_content({before_message : "Redirecting..", redirect : true, url:response.data.redirect, link:response.data.redirect, callback_parameters:{page:page, previous:previous, data:response.data, title:response.data.title}, anchor:page.anchor, post_parameters:{force_ajax:true}}, pagax_modules.pagax["navigation_callback"]);
            return false;
        }
    },

    push_state : function (response) {
        obj = this;

        if(response.data.hasOwnProperty("push_url")) {

            var page = {};
            previous = history.state;
            page.id = previous.id+1;
            page.url = response.data.push_url;
            page.title = response.data.title;
            page.anchor = {target:response.data.target};

            obj.navigation_callback({page:page, previous:previous, data:response.data});
        }
    },

    set_page_content : function(parameters) {

        var obj = this;
        $("#"+parameters.anchor.target).html(parameters.response.content);
        if (parameters.anchor.target == "content_container") {
            $("html, body").animate({scrollTop : 0}, 1);
        } else {
            $('html, body').animate({scrollTop: $("#"+parameters.anchor.target).offset().top-$("#topbar").outerHeight()-20}, 1);
        }
        $("#page_scripts").html(parameters.response.page_scripts);

        if(parameters.anchor.hasOwnProperty("data") && parameters.anchor.data.hasOwnProperty("targetType")) {
            pagax_modules.settings.modal.show(parameters.anchor.target);
        }

        if (parameters.response.hasOwnProperty("remove")) {
            $.each(parameters.response.remove, function(remove_key, item){
                $("#"+remove_key).remove();
            });
        }

        if (parameters.response.hasOwnProperty("hide")) {
            $.each(parameters.response.hide, function(section){
                $("#"+section).hide();
            });
        }

        setTimeout(function () {
            $(document).trigger("page_ready", parameters.response);
            $(document).trigger("page_load", parameters.response);
        }, 50);
    },

    on_modal_hide : function(target) {
        if (
            !(
                window.history.state.hasOwnProperty("next") &&
                window.history.state.next.hasOwnProperty("anchor") &&
                window.history.state.next.anchor.hasOwnProperty("data") &&
                window.history.state.next.anchor.data.hasOwnProperty("target") &&
                window.history.state.next.anchor.target == target
            ) ||
            (
                window.history.state.hasOwnProperty("anchor") &&
                window.history.state.anchor.hasOwnProperty("data") &&
                window.history.state.anchor.data.hasOwnProperty("target") &&

                window.history.state.hasOwnProperty("next") &&
                window.history.state.next.hasOwnProperty("anchor") &&
                window.history.state.next.anchor.hasOwnProperty("data") &&
                window.history.state.next.anchor.data.hasOwnProperty("target") &&
                window.history.state.anchor.target == target
            )
        ) {
            window.history.back();
        }
    },
    onpopstate : function(event) {

        var obj = this;

        if (
            event.state.hasOwnProperty("next") &&
            event.state.next.anchor.hasOwnProperty("data") &&
            event.state.next.anchor.data.hasOwnProperty("targetType") &&
            event.state.next.anchor.data.targetType == "modal" &&
            (
                !event.state.anchor.hasOwnProperty("data") ||
                (
                    event.state.anchor.hasOwnProperty("data") &&
                    (
                        !event.state.anchor.data.hasOwnProperty("targetType") ||
                        (
                            event.state.anchor.data.hasOwnProperty("targetType") &&
                            event.state.anchor.data.targetType != "modal"
                        )
                    )
                )
            ) &&
            $("#"+event.state.next.anchor.target).length
        ) {
            pagax_modules.settings.modal.hide(event.state.next.anchor.data.target);
            setTimeout(function(){
                pagax_modules.settings.modal.remove(event.state.next.anchor.data.target);
            }, 200);
            return false;
        }

        if(event.state) {
            obj.refresh_page(event.state);
        }
    },

    navigation_callback : function(parameters) {
        parameters.page.title = parameters.title;
        parameters.previous['next'] = parameters.page;

        if(parameters.data.hasOwnProperty("replace_url")) {
            parameters.previous.url = parameters.data.replace_url;
        }

        window.history.replaceState(parameters.previous,parameters.previous.title,parameters.previous.url);

        if(!(parameters.page.anchor.hasOwnProperty("data") && parameters.page.anchor.data.hasOwnProperty("sameState") && parameters.page.anchor.data.sameState==true)) {
            window.history.pushState(parameters.page,parameters.page.title,parameters.page.url);
        }

        document.title = parameters.title;
    },

    onready : function(event) {
        var obj = this;

        if(!(window.ActiveXObject || "ActiveXObject" in window)) {

            var url = window.location.href;

            var state_parameters = {
                id: (window.history.state != null && window.history.state.hasOwnProperty("id")) ? window.history.state.id : 0,
                url:url,
                title:document.title,
                anchor: (window.history.state != null && window.history.state.hasOwnProperty("anchor")) ? window.history.state.anchor : {target:"content_container"}
            };

            if (window.history.state != null && window.history.state.hasOwnProperty("anchor") && window.history.state.anchor.hasOwnProperty("data") && window.history.state.anchor.data.hasOwnProperty("targetType") && window.history.state.anchor.data.targetType == "modal" && !$("#"+window.history.state.anchor.target).length) {
                state_parameters.anchor = {target:"content_container"};
            }

            if(history.state) {

                if(history.state.hasOwnProperty('next')) {
                    state_parameters.next = history.state.next;
                }

                if(history.state.hasOwnProperty("form_parameters")) {
                    state_parameters.form_parameters = history.state.form_parameters;
                }

            }

            if (!$(".pagax-loader-layer").length) {
                var loader = '<div class="pagax-loader-layer">' +
                    '<div class="message-box">' +
                        '<div class="message">Loading...</div>' +
                        '<a class="cancel-loader">Cancel</a>' +
                    '</div>' +
                '</div>';

                $("body").append(loader);
                $(".pagax-loader-layer .cancel-loader").off("click").on("click", function(){
                    $(".pagax-loader-layer").hide();
                });
            }

            window.history.replaceState(state_parameters, document.title, url);
        }

        $("a[data-pagax_link='true'], div[href]").unbind("click").click(function(){

            var anchor = $(this);
            var location = anchor.attr('href');

            if(!((obj.user_agent.match(/Macintosh/g) && (obj.key_pressed == 91 || obj.key_pressed == 93)) || (obj.user_agent.match(/Macintosh/g) == null && obj.key_pressed == 17))){

                if(anchor.data("pagax_link") || anchor.is("div")) {

                    anchor.data("target", anchor.data("target") ? anchor.data("target") : "content_container");

                    if(location && anchor.data("target") && location != window.location.href) {

                        var page = {};
                        previous = history.state;
                        page.id = previous.id+1;
                        page.url = location;
                        page.title = document.title;
                        page.anchor = {target:anchor.data('target'), id:anchor.attr('id')};

                        if(!(window.ActiveXObject || "ActiveXObject" in window)) {

                            var parameters = {link:location, anchor:page.anchor, callback_parameters:{page:page, previous:previous}};

                            parameters.post_parameters = {
                                data : {}
                            };
                            parameters.anchor.data = {};

                            $.each($(this).data(), function(k, v){
                                if (!$.isPlainObject(v)) {
                                    parameters.post_parameters.data[k] = v;
                                    parameters.anchor.data[k] = v;
                                }
                            });
                            parameters.url = location;

                            if(anchor.data("type") == "script" && pagax_modules.settings.hasOwnProperty("script") && pagax_modules.settings.script.hasOwnProperty("timeout")) {
                                parameters.timeout = pagax_modules.settings.script.timeout;
                            } else if (pagax_modules.settings.hasOwnProperty("ajax") && pagax_modules.settings.script.hasOwnProperty("timeout")) {
                                parameters.timeout = pagax_modules.settings.script.timeout;
                            }

                            obj.load_content(parameters, pagax_modules.pagax["navigation_callback"]);
                        }

                    }

                    if(!(window.ActiveXObject || "ActiveXObject" in window)) {
                        return false;
                    }
                }
            }
        });

    },
    onkeydown : function (e) {
        obj = this;
        e = (e) ? e : document.event;
        obj.key_pressed = (e.which) ? e.which : e.keyCode;

        if(obj.key_pressed == 27) {
            if (window.history.state.hasOwnProperty("anchor") && window.history.state.anchor.hasOwnProperty("data") && window.history.state.anchor.data.hasOwnProperty("targetType") && window.history.state.anchor.data.targetType == "modal" && $("#"+window.history.state.anchor.target).length) {
                window.history.back();
                return false;
            }

        }
    },
    onkeyup : function (e) {
        obj = this;
        obj.key_pressed = false;
    }
};

$.fn.pagax = function() {
    $(this).find("a[href]:not([data-pagax_link='false'])").each(function(){
        var host = HOST;
        if(host.substr(-1) === '/') {
            host = host.substr(0, host.length - 1);
        }

        if($(this).attr("href").match(new RegExp(host,"g")) != null) {
            $(this).attr("data-pagax_link", "true");
        }
    });

    $.each(pagax_modules, function(key, func){
        if($.isFunction(func.onready))
        {
            func.onready();
        }
    });

    $(document).off("keydown").on("keydown", function(e){
        $.each(pagax_modules, function(key, func){
            if($.isFunction(func.onkeydown))
            {
                func.onkeydown(e);
            }
        });
    });

    $(document).off("keyup").on("keyup", function(e){
        $.each(pagax_modules, function(key, func){
            if($.isFunction(func.onkeyup))
            {
                func.onkeyup(e);
            }
        });
    });
}

$.initPagax = function(options){

    pagax_modules.settings = options;

    window.onpopstate = function(event) {
        $.each(pagax_modules, function(key, func){
            if($.isFunction(func.onpopstate))
            {
                func.onpopstate(event);
            }
        });
    };

    $(document).ready(function(){

        $(document).trigger("page_ready");

    });

}

$(document).on("ready", function(){
    $(document).trigger("page_ready");
});

$(document).on("page_ready", function(event, response){
    $("body").loaded(response);
});

$.fn.load_complete = function (response) {}

$.fn.loaded = function (response) {
    $(this).pagax();

    $("[data-ajax_form='true']").each(function(){
        var form = $(this);

        $(this).onSubmit({
            url : form.attr("action")        
        });
    });

    $(this).load_complete(response);
};