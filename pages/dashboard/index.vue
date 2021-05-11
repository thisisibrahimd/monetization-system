<template>
	<div>
		<section class="section">
			<div class="container has-text-centered">
				<nav class="level">
					<div class="level-left">
						<nuxt-link class="level-item" to="/">
							<figure class="image is-64x64">
								<img src="/logo.jpg" alt="Logo" class="is-rounded" />
							</figure>
							<div class="is-invisible">
								<p>2</p>
							</div>
							<p class="title">COMPANY</p>
						</nuxt-link>
					</div>

					<div class="level-right">
						<div class="level-item">
							<p class="subtitle">
								Hello
								<strong>{{ $auth.user.username }}</strong>
								<small>#{{ $auth.user.discriminator }}</small>
							</p>
							<div class="is-invisible">
								<p>2</p>
							</div>
							<button class="button is-warning is-small" @click="logout">
								logout
							</button>
						</div>
					</div>
				</nav>
			</div>
		</section>

		<section class="section mb-6">
			<div class="container">
				<div class="columns is-centered">
					<div class="column is-8">
						<div
							class="section has-background-light has-text-centered"
							style="border-radius: 10px;"
						>
							<p class="title">Purchase a Membership</p>
							<div v-if="active">
								<p>You have an Active Membership!</p>
							</div>
							<div v-else-if="stock.live">
								<p class="subtitle">
									You are purchasing a membership to our Discord Server.
								</p>
								<p>
									This payment is auto recurring. Current membership price is
									${{ stock.price }}. By purchasing, you agree to the terms of
									service listed in our Discord
								</p>
								<br />
								<button
									:class="
										purchasing
											? 'button is-warning is-light is-loading'
											: 'button is-warning is-light'
									"
									@click="purchase"
								>
									Purchase with Paypal
								</button>
								<br />
							</div>
							<div v-else>
								<p>Sorry! Our memberships are out of stock</p>
								<br />
							</div>
						</div>
					</div>
				</div>
				<div class="columns is-centered">
					<div class="column is-8" v-if="user">
						<section
							class="section has-background-light has-text-centered"
							style="border-radius: 10px"
						>
							<p class="title">Memberships</p>
							<div class="table-container">
								<table
									class="table is-inline-block is-striped"
									v-if="user.orders"
									style="border-radius: 10px;"
								>
									<thead>
										<tr>
											<th>Active</th>
											<th>ID</th>
											<th>Start Date</th>
											<th>Amount</th>
											<th>Email</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="(order, id) in user.orders" :key="id">
											<th>{{ order.status == "Active" ? "Yes" : "No" }}</th>
											<td>{{ id }}</td>
											<td>{{ order.start_date }}</td>
											<td>${{ order.amount }}</td>
											<td>{{ order.email }}</td>
											<td>
												<button
													class="button is-danger is-small"
													:disabled="order.status != 'Active'"
													@click="cancel(id)"
												>
													Cancel
												</button>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</section>
					</div>
				</div>
			</div>
		</section>

		<!-- <footer id="footer">
			<div class="hero-foot">
				<div style="height: 150px; overflow: hidden;">
					<svg
						viewBox="0 0 500 150"
						preserveAspectRatio="none"
						style="height: 100%; width: 100%;"
					>
						<path
							d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
							style="stroke: none; fill: #ffd700;"
						/>
					</svg>
				</div>
			</div>
		</footer> -->
	</div>
</template>

<script>
export default {
	async asyncData({ $axios }) {
		try {
			const { data: stock } = await $axios.get("/stock")
			const { data: user } = await $axios.get("/user")
			return { stock, user }
		} catch ({ message }) {
			return { stock: { live: false }, user: null }
		}
	},
	data() {
		return {
			purchasing: false,
		}
	},
	computed: {
		active() {
			let flag = false
			if (this.$data.user && this.$data.user.orders)
				for (const [id, order] of Object.entries(this.$data.user.orders)) {
					if (order.status == "Active") flag = true
				}
			return flag
		},
	},
	methods: {
		async logout() {
			await this.$auth.logout()
		},
		async purchase() {
			this.$data.purchasing = true
			try {
				const { data: links } = await this.$axios.get("/user/payment")
				const checkout_link = links.find(link => link.rel == "approval_url")
				alert("Redirecting to Paypal to complete purchase.")
				window.location.href = checkout_link.href
				// window.open(checkout_link.href)
			} catch ({ message }) {
				alert("Failed to checkout with paypal, try again.")
			}
			this.$data.purchasing = false
		},
		async cancel(id) {
			const result = window.confirm(
				`Are you sure you want to cancel order ${id}?`
			)
			if (result) {
				try {
					const response = await this.$axios.delete(`/user/payment`, {
						data: { id },
					})
					console.log(response)
					alert("Cancellation Successful")
					window.location.href = window.location.href
				} catch ({ message }) {
					console.log(message)
					alert(
						"Failed to cancel membership. Try again or contact admins in discord"
					)
				}
			}
		},
	},
}
</script>

<style>
#footer {
	position: absolute;
	left: 0;
	bottom: 0;
	height: 6rem;
	width: 100%;
}
</style>
