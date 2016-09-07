<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Zomato Base Home">
        <meta name="author" content="Arun Tangri">
        <title><?php echo $_title; ?></title>
        <link rel="stylesheet" type="text/css" href="css/style.css">
        <script type="text/javascript">
            var HOST = "<?php echo HOST; ?>";
            var pagax_modules = {};
        </script>
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js"></script>
    </head>

    <body>
        <a href="<?php echo HOST; ?>">Home</a>
        <a href="<?php echo HOST; ?>about">About</a>
        <a href="<?php echo HOST; ?>modal" data-target-type="modal" data-target="modal">Modal</a>
        <a href="<?php echo HOST; ?>login">Login</a>

        <div id="content_container">
            <?php echo $_content; ?>
        </div>

    </body>
    <script type="text/javascript" src="js/pagax/ajax.js"></script>
    <script type="text/javascript" src="js/pagax/bind_change.js"></script>
    <script type="text/javascript" src="js/pagax/forms.js"></script>
    <script type="text/javascript" src="js/pagax/pagax.js"></script>
    <script type="text/javascript" src="js/script.js"></script>

    <div id="page_scripts">
        <?php echo $page_scripts; ?>
    </div>
</html>
