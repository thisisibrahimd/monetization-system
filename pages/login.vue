<template>
	<!-- MAIN -->
	<section class="main hero is-black is-fullheight">
		<div class="hero-body">
			<div class="container has-text-centered">
				<!-- CONTENT -->
				<div class="card main">
					<!-- LOGO -->
					<div class="card-image is-inline-block">
						<nuxt-link to="/">
							<figure class="image is-128x128">
								<img src="/logo.jpg" class="is-rounded" alt="Logo" />
							</figure>
						</nuxt-link>
					</div>

					<!-- LINK -->
					<div class="card-content">
						<div class="content">
							<button class="button is-warning" @click="login">
								Login with Discord
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script>
export default {
	async mounted() {
		if (this.$route.hash) {
			const querys = this.$route.hash.slice(1).split("&").map(hash => hash.split("="))
			const token = query[1][1]
			try {
				await this.$auth.setToken("discord", token)
			} catch(error) {
				console.log(error)
			}
		}
	},
	methods: {
		async login() {
			try {
				await this.$auth.loginWith("discord")
			} catch (error) {
				console.log(error)
				window.location.href = "DISCORD_OAUTH2_URL"
			}
		},
	},
}
</script>

<style scoped>
.main {
	background: black;
}
</style>
