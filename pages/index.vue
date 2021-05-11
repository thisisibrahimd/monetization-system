<template>
	<!-- MAIN -->
	<div id="main">
		<!-- HEADER | LANDING -->
		<section id="navbar" class="hero">
			<!-- LANDING -->
			<div class="hero-body">
				<div class="container has-text-centered">
					<figure class="image is-128x128 is-inline-block">
						<img src="/logo.jpg" class="is-rounded" alt="logo" />
					</figure>
					<h1 class="title has-text-white">COMPANY</h1>
					<h2 class="subtitle is-4 has-text-white black-text-shadow">
						MOTTO
					</h2>
					<h2 class="subtitle is-5 has-text-white black-text-shadow">
						CALL TO ACTION PHRASE
					</h2>
					<nuxt-link
						class="button is-light is-warning"
						:to="stock.live ? '/dashboard' : '/'"
						no-prefetch
						:disabled="!stock.live"
					>
						{{ stock.live ? "Purchase" : "Sold Out" }}
					</nuxt-link>
					<nuxt-link
						to="/dashboard"
						no-prefetch
						class="button is-link is-light"
					>
						Dashboard
					</nuxt-link>
				</div>
			</div>
		</section>

		<!-- FEATURES -->
		<div class="section container">
			<div class="columns is-multiline is-centered">
				<div
					class="column is-one-quarter has-text-centered"
					v-for="feature in features"
					:key="feature.id"
				>
					<div class="box">
						<p class="subtitle">
							<span class="icon">
								{{ feature.icon }}
							</span>
							<strong>{{ feature.name }}</strong>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	auth: false,
	async asyncData({ $axios }) {
		try {
			const { data: stock } = await $axios.get("/stock")
			return { stock }
		} catch ({ message }) {
			return { stock: { live: false } }
		}
	},
	data() {
		return {
			features: [
				{ id: 1, icon: "📓", name: "Example" },
			],
		}
	},
}
</script>

<style scoped>
#navbar::before {
	position: absolute;
	transform: skewY(8deg);
	bottom: 30vw;
	right: 0;
	width: 100%;
	height: 150%;
	content: "";
	background: black;
}
.white-text-shadow {
	text-shadow: 2px 2px white;
}
.black-text-shadow {
	text-shadow: 2px 2px black;
}
</style>
