<#macro defaultHeader>
<p>
	defaultHeader here
</p>
</#macro>

<#macro defaultFooter>
<p>
	defaultFooter here
</p>
</#macro>

<#macro layout header=defaultHeader footer=defaultFooter>
<html>
<head>
	<title>
		${ftl.title}
	</title>
</head>
<body>

<header>
	<@header />
</header>
<main>
	<#nested>
</main>

<footer>
	<@footer />
</footer>


</body>
</html>
</#macro>
