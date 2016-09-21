var modal = {
    create : function(id) {
        if(!$("#"+id).length){
            $("body").addClass("no-overflow").append('<div class="modal_container"><div class="modal" id="'+id+'"></div></div>')
        }
    },
    activate : function(id){
        $("#"+id).parent(".modal_container").addClass("active");
    },
    show : function(id) {
        $("#"+id).parent(".modal_container").addClass("active visible");
    },
    hide : function(id) {
        $("#"+id).parent(".modal_container").removeClass("active visible");
        $("body").removeClass("no-overflow");
    },
    remove : function(id) {
        this.hide(id);
        $("#"+id).parent(".modal_container").remove();
    },

    onready : function(id){
        var plugin = this;
        $("#"+id + " > i").off("click").on("click", function(){
            $(document).trigger("back");
        });
    }
};

$.initPagax({
    modal : {
        container : ".modal_container",
        modal : ".modal",
        create : modal.create,
        show : modal.show,
        hide : modal.hide,
        activate : modal.activate,
        remove : modal.remove,
        onready : modal.onready
    }
});


$(document).on("page_ready", function(){
/*
    $.ajax_request({
        url : "set-access-scope",
        before_message : "Loading",
        beforeSend : function() {
            console.log("Sending request..");
        },
        success : function(response,status,xhr) {
            console.log("Received Response Successfully..");
        },
        complete : function(response,status,xhr) {
            console.log("Request Completed Successfully..");
        }
        submitData : data
    },
    function(response) {
        console.log(response);
    });
*/
});