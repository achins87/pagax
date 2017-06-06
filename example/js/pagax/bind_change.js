var change_parameters = {};

$.fn.bindChange = function (parameters) {

    change_parameters[$(this).attr("id")] = {
        url : parameters.url,
        loading_message : parameters.loading_message,
        bind : parameters.bind,
        default_selected : parameters.hasOwnProperty("default_selected") ? parameters.default_selected : '',
        success : function (response) {
            if (parameters.hasOwnProperty("success") && typeof parameters.success == 'function') {
                parameters.success(response);
                if (parameters.hasOwnProperty("complete") && typeof parameters.complete == 'function') {
                    parameters.complete(response);
                }
            }
        },
        complete : function (response) {
            if (parameters.hasOwnProperty("complete") && typeof parameters.complete == 'function') {
                parameters.complete(response);
            }
        },
        bind_by_value : parameters.hasOwnProperty("bind_by_value") ? parameters.bind_by_value : false,
        binding_values : parameters.hasOwnProperty("binding_values") ? parameters.binding_values : [],
        restricted_values : parameters.hasOwnProperty("restricted_values") ? parameters.restricted_values : []
    };

    $(this).off("change");
    $(this).on("change", function(){
        var dropdown_id = $(this).attr("id");
        var name = $(this).attr("name");
        var value = $(this).val();
        var data = {};
        data[name] = value;

        $(change_parameters[dropdown_id].bind).find("option[value!='"+change_parameters[dropdown_id].default_selected+"']").remove();
        $(change_parameters[dropdown_id].bind).parent(".dropdown").dropdown("clear");

        if (change_parameters[dropdown_id].bind_by_value && $.inArray(value, change_parameters[dropdown_id].restricted_values) >= 0) {
            $(change_parameters[dropdown_id].bind).parent(".dropdown").dropdown("clear");
            $(change_parameters[dropdown_id].bind).attr("disabled", "disabled");
            $(change_parameters[dropdown_id].bind).parent(".dropdown").addClass("disabled");
            change_parameters[dropdown_id].complete();
            return false;
        } else {
            $(change_parameters[dropdown_id].bind).removeAttr("disabled");
            $(change_parameters[dropdown_id].bind).parent(".dropdown").removeClass("disabled");
        }

        if (value != 0) {
            $.ajax_request({
                url : change_parameters[dropdown_id].url,
                request_headers : {'X-Requested-With': 'XMLHttpRequest'},
                before_message : change_parameters[dropdown_id].loading_message,
                submitData : data
            },
            function(response) {
                $.each(response.data.options, function(id, option){
                    $(change_parameters[dropdown_id].bind).append('<option value="'+id+'">'+option+'</option>')
                });

                $(change_parameters[dropdown_id].bind).parent(".dropdown").dropdown("set selected", change_parameters[dropdown_id].default_selected);
                change_parameters[dropdown_id].success(response);
            });
        }
    });
}

