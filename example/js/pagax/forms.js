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
                        element_name = element_name.replace("[]", "");
                        if(!$.isArray(arr[element_name])) {
                            arr[element_name] = [];
                        }
                        arr[element_name].push($(this).val());
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
    options.url = options.hasOwnProperty("url") ? options.url : $(this).attr("action");
    var submit_parameters = pagax_modules.ajax.build(options);
    submit_parameters.id = $(this).attr("id");

    pagax_modules.ajax.form_is_in_progress = false;

    $(this).off("submit").on("submit", function(e){
        e.preventDefault();

        if (options.hasOwnProperty("validate") && !$(this).hasClass("isValid")) {
            return false;
        }

        if(!pagax_modules.ajax.form_is_in_progress) {
            pagax_modules.ajax.form_is_in_progress = true;

            submit_parameters.data = $.extend({}, submit_parameters.data, pagax_modules.forms.get_values(submit_parameters.id));
            var get_parameters = pagax_modules.ajax.parseQueryString(location.search);
            if (get_parameters != "undefined") {
                submit_parameters.data = $.extend({}, submit_parameters.data, get_parameters);
            }

            pagax_modules.ajax.submit_form(submit_parameters);
        }
    });
};