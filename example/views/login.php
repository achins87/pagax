<?php
$_title = "Login";

$_scripts = array(
    "login.js"
);

?>
<h1>Form</h1>
<form id="login" method="post" action="form_action.php" data-ajax_form="true">
    <input type="text" name="username"/>
    <input type="password" name="password"/>
    <input type="submit" name="login" value="Login" />
</form>