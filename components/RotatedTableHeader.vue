<script setup lang="ts"></script>

<template>
	<th class="cursor-pointer text-center font-weight-bold pr-md-1 rotated-header">
		<div class="rotated-content">
			<slot />
		</div>
	</th>
</template>

<style scoped>
.rotated-header {
	/* width: 32px !important; */
	max-width: 30px !important;
	white-space: nowrap;
	vertical-align: bottom;
	padding: 0 !important;
	position: relative;
	overflow: visible;
}
.rotated-content {
	transform: rotate(-45deg) translate(-3em, -1em);
	width: max-content;
	padding: 5px;
	transform-origin: 0 0;
	position: relative;
}
.rotated-header::after {
	content: '';
	position: absolute;
	bottom: 0;
	width: 100%;
	left: 0;
	height: 1px;
	background-color: rgba(0, 0, 0, 0.12);
	transform: rotate(-45deg);
	transform-origin: 0 100%;
}
/*width: 141%;  √2 × 100% to account for 45-degree rotation */
</style>
