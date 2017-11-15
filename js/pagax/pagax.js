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

        if(parameters.hasOwnProperty("post_parameters")) {
            ajax_parameters.data = $.extend({}, ajax_parameters.data, parameters.post_parameters);

            if (parameters.post_parameters.hasOwnProperty("data") && parameters.post_parameters.data.hasOwnProperty("targetType") && parameters.post_parameters.data["targetType"] == "modal") {
                ajax_parameters.targetType = "modal";
                if (!$("#"+parameters.post_parameters.data.target).length) {
                    pagax_modules.settings.modal.create(parameters.post_parameters.data.target);
                }
                pagax_modules.settings.modal.activate(parameters.post_parameters.data.target);

                $("#"+parameters.post_parameters.data.target).parents(pagax_modules.settings.modal.container).off("click").on("click", function(e){
                    if (!$("#"+parameters.post_parameters.data.target).is(e.target) && $("#"+parameters.post_parameters.data.target).has(e.target).length === 0) {
                        if (!(window.history.state.hasOwnProperty("next") && window.history.state.next.anchor.hasOwnProperty("data") && window.history.state.next.anchor.data.hasOwnProperty("target") && window.history.state.next.anchor.target == parameters.post_parameters.data.target)) {
                            window.history.back();
                        } else {
                            pagax_modules.settings.modal.hide(parameters.post_parameters.data.target);
                        }
                    }
                })
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

        setTimeout(function () {
            $(document).trigger("page_ready");
            $(document).trigger("page_load");
        }, 50);
    },

    onpopstate : function(event) {

        var obj = this;
        if (event.state.hasOwnProperty("next") && event.state.next.anchor.hasOwnProperty("data") && event.state.next.anchor.data.hasOwnProperty("targetType") && event.state.next.anchor.data.targetType == "modal" && $("#"+event.state.next.anchor.target).length) {
            pagax_modules.settings.modal.hide(event.state.next.anchor.data.target);
            setTimeout(function(){
                pagax_modules.settings.modal.remove(event.state.next.anchor.data.target);
            }, 100);
            return false;
        }

        if(event.state) {

            state_parameters = {
                url:event.state.url,
                link:event.state.url,
                anchor:event.state.anchor
            };

            if (event.state.anchor.hasOwnProperty("data")) {
                state_parameters.post_parameters = {
                    data : event.state.anchor.data
                };
            }

            obj.load_content(state_parameters, function(parameters){
                window.history.replaceState(event.state,parameters.title, event.state.url);
                document.title = parameters.title;
            });
        }
    },

    navigation_callback : function(parameters) {
        parameters.previous['next'] = parameters.page;

        if (parameters.title) {
            parameters.page.title = parameters.title;
        } else {
            parameters.title = parameters.page.title;
        }

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
    },
    onkeyup : function (e) {
        obj = this;
        obj.key_pressed = false;
    }
};

$.fn.pagax = function() {
    $(this).find("a[href]").each(function(){
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

    $(document).off("onkeyup").on("onkeyup", function(e){
        $.each(pagax_modules, function(key, func){
            if($.isFunction(func.onkeyup))
            {
                func.onkeyup(e);
            }
        });
    });
}


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


$(document).on("page_ready", function(){
    $("body").loaded();
});

$.fn.loaded = function (parameters) {
    $(this).pagax();
};