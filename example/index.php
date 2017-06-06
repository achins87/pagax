<?php
include_once("routes.php");
ob_start();

if (array_key_exists($_GET["action"], $routes)) {
    include_once("views/".$routes[$_GET["action"]].".php");
} else {
    include_once("views/404.php");
}
$_content = ob_get_clean();

$page_scripts = "";

if(isset($_REQUEST["view_only"]) && $_REQUEST["view_only"] == "true") {

    if(!empty($_scripts)) {
        $page_scripts = '<script type="text/javascript">';

        foreach($_scripts as $key => $script) { 
            $page_scripts .= "$.getScript('js/".$script."');";
        }

        $page_scripts .= "</script>";
    }

    $return_data = array(
        "title" => $_title,
        "content" => $_content,
        "page_scripts" => $page_scripts
    );

    if (isset($response_parameters)) {
        foreach ($response_parameters as $key => $parameter) {
            $return_data[$key] = $parameter;
        }
    }

    echo json_encode(
        array(
            "status" => "success",
            "data" => $return_data
        )
    );
} else {
    if(!empty($_scripts)) {
        foreach($_scripts as $key => $script) { 
            $page_scripts .= '<script type="text/javascript" src="js/'.$script.'"></script>';
        }
    }
    include_once("wrapper.php");
}
?>