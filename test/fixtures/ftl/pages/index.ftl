<#assign context = ftl>

<#import "${context.dynamicImport}" as page />
<#import "/layouts/section.ftl" as util />

<#macro header>
<strong>
	custom header for home page
</strong>
</#macro>

<@page.layout header=header>
<h2>${currentPage.basename}</h2>

<h3>Title: ${context.title}</h3>

<div class="partial-wrapper">
	<#assign context=context.myFtlData>

	<@util.section>
		<#include "/partials/test.ftl" />
	</@util.section>
</div>

<p>
	It is working. or what ...
</p>
</@page.layout>
