<#macro section>
<section class="c-section">
	<#if headline?exists>
	<header>
		<h3>${headline}</h3>
	</header>
	</#if>
	<div class="section__content">
		<#nested>
	</div>
</section>
</#macro>
